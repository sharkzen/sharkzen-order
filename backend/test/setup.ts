// ต้อง import เป็นอย่างแรกของทุกไฟล์เทส: ชี้ DATABASE_URL ไปที่ schema ชั่วคราวก่อนที่ prisma จะโหลด
// เทสจึงไม่แตะข้อมูลของ dev และแต่ละไฟล์ได้ฐานข้อมูลว่างของตัวเอง
import { execSync } from "node:child_process";
import { after } from "node:test";

const base = process.env.DATABASE_URL;
if (!base) throw new Error("ไม่มี DATABASE_URL (รันผ่าน npm test เพื่อโหลด .env)");

const schema = `test_${process.pid}_${Date.now()}`;
const url = new URL(base);
url.searchParams.set("schema", schema);
process.env.DATABASE_URL = url.toString();
process.env.NODE_ENV = "test";

execSync("npx prisma migrate deploy", { env: process.env, stdio: "pipe" });

after(async () => {
  const { prisma } = await import("@/lib/prisma.js");
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await prisma.$disconnect();
});
