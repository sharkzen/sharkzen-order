# SHARKZEN ORDER — Backend

Fastify 5 + Socket.IO + TypeScript + Prisma 6 + PostgreSQL (พอร์ต 3001)
ภาพรวมโปรเจกต์อยู่ที่ [README หลัก](../README.md) ส่วนการ deploy ดู [docs/DEPLOY.md](../docs/DEPLOY.md)

## เริ่มใช้งาน

```bash
cp .env.example .env     # อย่างน้อยต้องใส่ JWT_SECRET (>= 32 ตัว) และ STRIPE_SECRET_KEY
npm install
npm run db:up            # Postgres + Mailpit (รัน docker-compose.yml ที่ root)
npm run prisma:deploy    # สร้างตาราง (ตอนแก้ schema ใช้ npm run prisma:migrate)
npm run prisma:seed      # แพ็กเกจ ค่าตั้งระบบ แอดมิน และเมนู/โต๊ะตัวอย่างให้ร้านที่ยังว่าง
npm run dev              # http://localhost:3001
```

## คำสั่ง

| คำสั่ง | ทำอะไร |
| --- | --- |
| `npm run dev` | รันแบบ watch |
| `npm test` | เทสต์ทั้งหมด (รันบน schema ชั่วคราว ไม่แตะข้อมูล dev) |
| `npm run typecheck` | ตรวจ TypeScript |
| `npm run build` / `npm start` | build เป็น `dist/` แล้วรัน |
| `npm run prisma:migrate` | สร้าง migration ใหม่จากการแก้ schema (dev) |
| `npm run prisma:deploy` | apply migration ที่มีอยู่ |
| `npm run prisma:seed` | seed ข้อมูลตั้งต้น รันซ้ำได้ ไม่ทับสิ่งที่แก้แล้ว |
| `npm run admin:create -- <email> <password>` | สร้าง/เลื่อนสิทธิ์เป็นผู้ดูแลระบบ (และตั้งรหัสผ่านใหม่) |

seed ตอนพัฒนาสร้างแอดมิน `admin@sharkzen.local` / `Aa123456` (เฉพาะตอนพัฒนา)
บน production ต้องตั้ง `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` และ seed จะไม่ใส่เมนู/โต๊ะตัวอย่าง

## ตัวแปรสภาพแวดล้อมสำคัญ

ดูทั้งหมดพร้อมคำอธิบายใน `.env.example` (validate ที่ `src/config/env.ts`)

- `DATABASE_URL`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `FRONTEND_URL`, `CORS_ORIGIN`
- `SMTP_*`, `MAIL_FROM` (ตอนพัฒนาใช้ Mailpit)
- `R2_*` อัปโหลดรูปเมนู (ไม่ตั้ง = อัปโหลดรูปไม่ได้ ระบบอื่นยังทำงาน)
- `ADMIN_IP_ALLOWLIST` จำกัด IP ที่เข้า `/api/admin`
- `ADMIN_REQUIRE_2FA` บังคับ 2FA ของแอดมิน (ค่าเริ่มต้น: เฉพาะ `NODE_ENV=production`)
- `TRUST_PROXY` ตั้ง `true` เมื่ออยู่หลัง reverse proxy

## โครงสร้าง

```
prisma/        schema, migrations, create-admin.ts
src/
  server.ts    จุดเริ่มต้น (listen, graceful shutdown, sync แพ็กเกจ/ตั้งค่าทุก 15 วินาที)
  app.ts       สร้าง Fastify, ลงทะเบียน plugin/route, error handler
  seed.ts      seed ข้อมูลตั้งต้น (compile เข้า dist เพื่อรันใน Docker)
  config/      env (validate ด้วย zod)
  lib/         prisma, access (แบน/พนักงาน), route-permissions, plans, settings,
               totp (2FA), ip-allowlist, stripe, mailer, storage (R2), crypto ฯลฯ
  plugins/     auth (cookie + JWT, authenticate / authenticateAdmin), socket.io
  routes/      กำหนด URL -> controller/service (ทุกเส้นอยู่ใต้ /api)
  controllers/ รับ request, validate, เรียก service
  services/    business logic + เรียก Prisma
  schemas/     zod schema ของ params/query/body
  sockets/     socket.io server และชื่อ event
  utils/       AppError, route helper ฯลฯ
test/          เทสต์ (node:test) แยกตามหัวข้อ
```

Flow: `route -> controller -> service -> prisma`

## ผู้ใช้ 3 แบบ

ทั้งหมดใช้ cookie session เดียวกัน (`sz_session`) แต่ JWT ต่างกัน

- **เจ้าของร้าน (OWNER)**: ทำได้ทุกอย่างในร้านของตัวเอง
- **พนักงาน (kind = "staff")**: ล็อกอินที่ `POST /api/auth/staff-login` ด้วยรหัสร้าน + ชื่อผู้ใช้ + รหัสผ่าน
  ทุก API ตรวจสิทธิ์ตามตาราง `src/lib/route-permissions.ts` แบบ default-deny
  **เพิ่ม route ใหม่ที่พนักงานต้องใช้ ต้องเพิ่มบรรทัดในตารางนี้**
- **ผู้ดูแลระบบ (ADMIN)**: ใช้ `/api/admin/*` เท่านั้น มี 2FA (TOTP) และ IP allowlist

สถานะแบน/ระงับ/สิทธิ์พนักงานอ่านจากฐานข้อมูลทุกคำขอ (ไม่มีแคช) จึงมีผลทันที

## Endpoints (กลุ่มหลัก)

| Prefix | ใช้ทำอะไร |
| --- | --- |
| `/api/health`, `/api/health/live` | ตรวจสถานะ (503 เมื่อต่อ DB ไม่ได้ / liveness) |
| `/api/auth/*` | สมัคร ยืนยัน OTP เข้าสู่ระบบ (เจ้าของ/พนักงาน/แอดมิน) ลืมรหัสผ่าน 2FA |
| `/api/public/*` | ฝั่งลูกค้าหลังสแกน QR (เมนู สั่งอาหาร เรียกพนักงาน) ราคาแพ็กเกจ ช่องทางติดต่อ |
| `/api/shop`, `/api/menu`, `/api/tables`, `/api/orders` | จัดการร้าน |
| `/api/cashier`, `/api/reports`, `/api/dashboard`, `/api/notifications` | คิดเงิน รายงาน ภาพรวม การแจ้งเตือน |
| `/api/staff` | พนักงาน บทบาท สิทธิ์ ตรวจชื่อผู้ใช้ซ้ำ |
| `/api/billing` | แพ็กเกจและการชำระเงินของเจ้าของ (Stripe) |
| `/api/payments/webhook` | Stripe เรียก (ตรวจลายเซ็นจาก raw body) |
| `/api/uploads/image` | อัปโหลดรูป (แปลงเป็น WebP ส่งขึ้น R2) |
| `/api/admin/*` | ผู้ดูแลระบบ: overview, users, shops, plans, settings, logs |

Socket.IO: เจ้าของ/พนักงานเข้าห้องของร้านด้วย session cookie ส่วนลูกค้าเข้าห้องโต๊ะด้วย token จาก QR
ชื่อ event ทั้งหมดอยู่ที่ `src/sockets/events.ts`

## Stripe (โหมดทดสอบ)

1. ใส่ `STRIPE_SECRET_KEY=sk_test_...` ใน `.env`
2. `stripe listen --forward-to localhost:3001/api/payments/webhook` แล้วเอา `whsec_...` ใส่ `STRIPE_WEBHOOK_SECRET`
3. สมัครเป็นเจ้าของร้าน เข้าหน้า "แพ็กเกจ" แล้วกดสมัครแพ็กเกจ จ่ายด้วยบัตรทดสอบ `4242 4242 4242 4242`
4. webhook อัปเดตสถานะการสมัคร ราคาของแพ็กเกจมาจากตาราง Plan (แก้ได้ที่หน้าแอดมิน) ไม่ใช่ค่าในโค้ด
   เปลี่ยนราคาแล้ว ผู้ที่สมัครไว้แล้วยังถูกคิดราคาเดิมจนกว่าจะเปลี่ยนแพ็กเกจ
