# คู่มือ Deploy, ความปลอดภัย และการดูแลระบบ

เอกสารนี้ครอบคลุม staging/production เครื่องเดียวด้วย Docker Compose (`docker-compose.prod.yml`)
ไฟล์ที่เกี่ยวข้อง: `backend/Dockerfile`, `frontend/Dockerfile`, `ops/Caddyfile`, `ops/backup.sh`, `ops/restore.sh`, `.env.example`

## 1. ข้อกำหนด

- เครื่อง Linux ที่ลง Docker + Docker Compose v2, เปิดพอร์ต 80/443
- โดเมนที่ชี้ A record มาที่เครื่อง (Caddy ขอใบรับรอง HTTPS ให้เอง)
- บัญชี Stripe (โหมด test สำหรับ staging) ตั้ง webhook ไปที่ `https://<โดเมน>/api/payments/webhook`
- SMTP จริงสำหรับส่ง OTP/รีเซ็ตรหัสผ่าน และ Cloudflare R2 สำหรับรูปเมนู

## 2. Deploy (ครั้งแรกและทุกครั้งที่อัปเดต)

```bash
git clone <repo> && cd sharkzen-order
cp .env.example .env        # กรอกค่าจริง: โดเมน รหัส DB JWT_SECRET Stripe SMTP R2 และแอดมินคนแรก
docker compose up -d --build
```

อัปเดตเวอร์ชันครั้งต่อไป แค่:

```bash
git pull && docker compose up -d --build
```

`.env` มี `COMPOSE_FILE=docker-compose.prod.yml` จึงไม่ต้องใส่ `-f` (เครื่อง dev ไม่มี `.env` นี้ จึงใช้ `docker-compose.yml` เดิมที่มีแค่ Postgres/Mailpit)

ทุกครั้งที่ `up` บริการ **migrate** จะทำให้เองตามลำดับ แล้ว backend จึงเริ่ม (ถ้า migrate ล้มเหลว backend จะไม่เริ่ม):

1. `prisma migrate deploy` สร้าง/อัปเดตโครงสร้างตาราง (ข้ามอันที่ทำแล้ว)
2. seed ข้อมูลตั้งต้น: แพ็กเกจและราคา, ค่าตั้งระบบ (วันทดลอง รายปีแถม ช่องทางติดต่อ), แอดมินคนแรกจาก `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`

**รันซ้ำปลอดภัย:** seed เพิ่มเฉพาะที่ยังไม่มี ไม่ทับสิ่งที่แอดมินแก้ไปแล้ว (ราคาแพ็กเกจ ค่าตั้งระบบ) และไม่เปลี่ยนรหัสผ่านของแอดมินที่มีอยู่แล้ว
(ทดสอบแล้ว: แก้ราคา/วันทดลองใน DB → `up -d --build` ซ้ำ → ค่ายังอยู่) seed ไม่ใส่เมนู/โต๊ะตัวอย่างบน production

ตรวจว่าขึ้นครบ: `docker compose ps` ทุกบริการ `Up`/`healthy` (migrate จะ `Exited (0)` ซึ่งปกติ) และ `https://<โดเมน>/api/health` ตอบ `{"status":"ok","database":"up"}`
ดูผล migrate/seed: `docker compose logs migrate`

ข้อกำหนดก่อน `up`: โดเมนชี้ A record มาที่ VPS และเปิดพอร์ต 80/443 (Caddy ออกใบรับรอง HTTPS เอง)

## 3. แอดมินและ 2FA

- แอดมินคนแรกถูกสร้างตอน deploy ครั้งแรกจาก `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` ใน `.env` **ใช้รหัสผ่านที่เดายาก**
  หลังสร้างแล้วจะเอาสองค่านี้ออกจาก `.env` ก็ได้ (seed จะไม่แตะบัญชีที่มีอยู่แล้ว)
- เข้าสู่ระบบที่ `/login` ระบบพาไป `/admin`
- production บังคับ 2FA: ครั้งแรกจะเห็นหน้าตั้ง 2FA ให้สแกน QR ด้วยแอป Authenticator แล้วกรอกรหัส 6 หลักยืนยัน
  หลังจากนั้นทุกครั้งที่ล็อกอินต้องกรอกรหัสด้วย
- ตั้ง `ADMIN_IP_ALLOWLIST` เป็น IP/CIDR ของออฟฟิศ/VPN: IP อื่นที่เรียก `/api/admin/*` จะได้ 404
- **ไม่มีวิธีรีเซ็ต 2FA ผ่านหน้าเว็บโดยตั้งใจ** ถ้าทำเครื่องหายให้รีเซ็ตที่ฐานข้อมูล:
  `docker compose exec postgres psql -U sharkzen -d sharkzen_order -c "UPDATE \"User\" SET \"totpSecret\"=NULL, \"totpEnabledAt\"=NULL WHERE email='...';"` แล้วตั้งใหม่
- ลืมรหัสผ่านแอดมิน: ใช้ `npm run admin:create -- อีเมล รหัสใหม่` จากเครื่องที่มีซอร์สโค้ดและเชื่อมฐานข้อมูลได้
- อย่าใช้บัญชีแอดมินเดียวกันกับบัญชีเจ้าของร้าน

## 4. ผู้ใช้ พนักงาน และการแบน

- พนักงานเข้าที่ `/staff-login` ด้วย **รหัสร้าน** (เจ้าของดูได้ที่หน้า "พนักงาน") + ชื่อผู้ใช้ + รหัสผ่าน
  ครั้งแรกต้องเปลี่ยนรหัสผ่านก่อนใช้งาน
- สิทธิ์พนักงานบังคับที่ backend แบบ default-deny: ตาราง `backend/src/lib/route-permissions.ts`
  **เพิ่ม API ใหม่ที่พนักงานต้องใช้ ต้องเพิ่มบรรทัดในตารางนี้** ไม่งั้นพนักงานจะได้ 403 (เทสต์ `security.test.ts` กันสิทธิ์พิมพ์ผิด)
- แบนผู้ใช้/ระงับสาขา: มีผลทันทีกับเจ้าของ พนักงาน และลูกค้าหน้าโต๊ะ (ตรวจจากฐานข้อมูลทุกคำขอ ไม่มีแคช)

## 5. รันหลายเครื่อง (scale)

ตอนนี้ **แนะนำรัน backend เครื่องเดียว** เพราะ Socket.IO ยังไม่มี adapter ข้ามเครื่อง
(ออเดอร์ใหม่/การแจ้งเตือนสดจะไปถึงเฉพาะ client ที่ต่อกับเครื่องเดียวกัน) ส่วนที่รองรับหลายเครื่องแล้ว:

| ส่วน | พฤติกรรม |
| --- | --- |
| แบน/ระงับ/สิทธิ์พนักงาน | อ่านจาก DB ทุกคำขอ มีผลทันทีทุกเครื่อง |
| แพ็กเกจ/ราคา/ตั้งค่าระบบ | แคชในหน่วยความจำ รีเฟรชจาก DB ทุก 15 วินาที (เครื่องที่รับคำสั่งแก้เห็นทันที) |
| rate limit | นับต่อเครื่อง (ยังไม่ใช้ร่วมกัน) |

ถ้าจะขยายเป็นหลายเครื่อง ต้อง: (1) เพิ่ม `@socket.io/redis-adapter` + Redis, (2) ใช้ store Redis ของ `@fastify/rate-limit`,
(3) ตั้ง sticky session ที่ load balancer สำหรับ `/socket.io`

## 6. สำรองและกู้ข้อมูล

- บริการ `backup` สำรองอัตโนมัติทุก `BACKUP_INTERVAL_HOURS` (ค่าเริ่มต้น 24) เก็บ `BACKUP_KEEP_DAYS` วัน (14) ใน volume `backups`
- สั่งสำรองทันที: `docker compose exec backup /bin/sh /backup.sh`
- ดูไฟล์: `docker compose exec backup ls -lh /backups`
- **สำเนาต้องออกไปนอกเครื่องด้วย** (volume เดียวกับเครื่องเสียพร้อมกันได้) เช่น cron บนเครื่องโฮสต์:
  `docker compose cp backup:/backups ./offsite && rclone copy ./offsite r2:sharkzen-backups`
- กู้คืน (ลบข้อมูลปัจจุบัน!):
  ```bash
  docker compose stop backend
  docker compose exec backup /bin/sh /restore.sh /backups/sharkzen-XXXX.dump
  docker compose start backend
  ```
- **ซ้อมกู้คืนอย่างน้อยเดือนละครั้ง** ไฟล์สำรองที่ไม่เคยลองกู้ถือว่ายังไม่มีไฟล์สำรอง
  (สคริปต์ผ่านการทดสอบแล้วกับฐานข้อมูล dev: สำรอง → กู้ลงฐานข้อมูลใหม่ → จำนวนข้อมูลตรงกัน)

## 7. Monitoring

- `GET /api/health` : 200 เมื่อต่อฐานข้อมูลได้, 503 เมื่อไม่ได้ → ใช้เป็น URL ของ uptime monitor (UptimeRobot, Better Stack ฯลฯ) แจ้งเตือนเมื่อไม่ 200
- `GET /api/health/live` : ใช้กับ Docker healthcheck (ไม่แตะฐานข้อมูล)
- log เป็น JSON (pino) ทุกคำขอมี `reqId` ดูด้วย `docker compose logs -f backend`
  error ที่ไม่มีใครจับถูกบันทึกระดับ `error`/`fatal` และ `uncaughtException` ปิดโปรเซสให้ Docker restart เอง
- **ยังไม่ได้ติดตั้ง**: ตัวรวม log/แจ้งเตือน error (เช่น Sentry, Grafana Loki) — ต้องเลือกบริการและใส่ DSN เอง
- ควรตั้งแจ้งเตือน: disk ใกล้เต็ม (ไฟล์สำรอง + ฐานข้อมูล), ใบรับรองใกล้หมด, Stripe webhook ล้มเหลว (ดูที่ Stripe Dashboard)

## 8. เช็กลิสต์ก่อนเปิด staging/production

- [ ] `JWT_SECRET` สุ่มใหม่ ไม่ใช้ค่าจาก dev; รหัสผ่านฐานข้อมูลสุ่มใหม่
- [ ] Stripe: ใช้คีย์ของโหมดที่ถูกต้อง, ตั้ง webhook secret, เปิด PromptPay ใน Dashboard (ถ้าใช้)
- [ ] `ADMIN_IP_ALLOWLIST` ตั้งแล้ว, สร้างแอดมินและเปิด 2FA แล้ว
- [ ] `TRUST_PROXY=true` (compose ตั้งให้แล้ว) — เช็กว่า IP ใน log เป็น IP จริงของผู้ใช้ ไม่ใช่ของ Caddy
- [ ] ส่งอีเมล OTP จริงถึงกล่องจดหมายได้ (ไม่ตกสแปม)
- [ ] ทดสอบ: สมัคร → ทดลองใช้ → จ่ายเงินด้วย Stripe test card → แบนจากหน้าแอดมินแล้วเห็น modal → ปลดแบน
- [ ] ทดสอบ: พนักงานเข้า `/staff-login` เห็นเฉพาะเมนูตามบทบาท
- [ ] ซ้อมกู้ข้อมูลจากไฟล์สำรองหนึ่งครั้ง
- [ ] uptime monitor ชี้ `/api/health` และมีคนได้รับแจ้งเตือนจริง

## 9. สิ่งที่ยังไม่ครอบคลุม (รู้ไว้ก่อนใช้งานจริง)

- ยังไม่มี Redis (ดูหัวข้อ 5), ไม่มีตัวรวม log/แจ้ง error, ไม่มี CI/CD pipeline
- ยังไม่มีการลบบัญชี/ส่งออกข้อมูลผู้ใช้ตาม PDPA และไม่มีอีเมลแจ้งเจ้าของเมื่อถูกแบน/ปลดแบน
- 2FA ของแอดมินยังไม่กันการใช้รหัสซ้ำภายในช่วงเวลาเดียวกัน (ยอมคลาดเคลื่อน ±30 วินาที) และไม่มีรหัสสำรอง (recovery codes)
- ลูกค้าที่ตัดบัตรผ่าน Stripe: การแก้สถานะ/วันจากหน้าแอดมินเปลี่ยนเฉพาะสิทธิ์ในระบบ Stripe อาจส่งค่าใหม่มาทับ
