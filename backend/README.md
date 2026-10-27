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
- Socket.IO events: `order:created`, `order:updated`
