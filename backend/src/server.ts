import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { refreshPlans } from "./lib/plans.js";
import { prisma } from "./lib/prisma.js";
import { loadSettings } from "./lib/settings.js";

const app = await buildApp();

// ข้อผิดพลาดที่ไม่มีใครจับ: บันทึกลง log (ให้ระบบ monitor เห็น) ส่วน uncaughtException ปิดโปรเซสให้ container restart แทนทำงานต่อในสภาพไม่แน่นอน
process.on("unhandledRejection", (reason) => app.log.error({ err: reason }, "unhandledRejection"));
process.on("uncaughtException", (error) => {
  app.log.fatal({ err: error }, "uncaughtException");
  process.exit(1);
});

const shutdown = async () => {
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await app.listen({ port: env.PORT, host: env.HOST });

// รันหลายเครื่อง: แพ็กเกจ/ตั้งค่าที่ผู้ดูแลแก้บนเครื่องหนึ่งจะไปถึงเครื่องอื่นภายในรอบนี้
// (สถานะแบน/ระงับและสิทธิ์พนักงานอ่านจาก DB ทุกคำขอ จึงมีผลทันทีทุกเครื่อง)
const SYNC_MS = 15_000;
setInterval(() => {
  Promise.all([refreshPlans(), loadSettings()]).catch((error: unknown) => app.log.error(error, "sync plans/settings failed"));
}, SYNC_MS).unref();
