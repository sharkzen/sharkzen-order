# SHARKZEN ORDER — Backend

Fastify + Socket.IO + TypeScript + Prisma + PostgreSQL (port 3001)

## เริ่มใช้งาน

```bash
cp .env.example .env
npm install
npm run db:up            # รัน PostgreSQL (หรือ docker compose up -d --build ที่ root)
npm run prisma:migrate   # สร้างตาราง
npm run prisma:seed      # ข้อมูลตัวอย่าง (ไม่บังคับ)
npm run dev              # http://localhost:3001
```

## โครงสร้าง

```
prisma/        schema, migrations, seed
src/
  server.ts    จุดเริ่มต้น (listen + graceful shutdown)
  app.ts       สร้าง Fastify, ลงทะเบียน plugin/route, error handler
  config/      env (validate ด้วย zod)
  lib/         prisma client
  plugins/     Fastify plugins (socket.io)
  routes/      กำหนด URL -> controller  (ทุกเส้นอยู่ใต้ /api)
  controllers/ รับ request, validate, เรียก service, ตอบกลับ / emit socket
  services/    business logic + เรียก Prisma
  schemas/     zod schema ของ params/query/body
  sockets/     socket.io server และชื่อ event
  utils/       AppError ฯลฯ
```

Flow: `route -> controller -> service -> prisma`

## Endpoints

- `GET /api/health`
- `GET /api/orders?status=NEW` · `GET /api/orders/:id`
- `POST /api/orders` · `PATCH /api/orders/:id/status`
- `POST /api/payments/checkout` body `{ orderId }` -> `{ url }` (Stripe Checkout)
- `POST /api/payments/webhook` (Stripe เรียก, ตรวจลายเซ็นจาก raw body)
- Socket.IO events: `order:created`, `order:updated`

## Stripe (โหมดทดสอบ)

1. ใส่ `STRIPE_SECRET_KEY=sk_test_...` ใน `.env`
2. `stripe listen --forward-to localhost:3001/api/payments/webhook` แล้วเอา `whsec_...` ใส่ `STRIPE_WEBHOOK_SECRET`
3. เรียก `POST /api/payments/checkout` เปิด `url` จ่ายด้วยบัตรทดสอบ `4242 4242 4242 4242`
4. webhook จะเปลี่ยน order เป็น PAID และ emit `order:updated`
