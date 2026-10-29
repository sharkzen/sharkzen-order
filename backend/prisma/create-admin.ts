import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/crypto.js";

const prisma = new PrismaClient();

/**
 * สร้าง/อัปเดตบัญชีผู้ดูแลระบบ: npm run admin:create -- <email> <password> [ชื่อ] [นามสกุล]
 * ถ้าอีเมลมีอยู่แล้วจะเปลี่ยนเป็นผู้ดูแลระบบและตั้งรหัสผ่านใหม่
 */
async function main() {
  const [email, password, firstName = "Admin", lastName = "SHARKZEN"] = process.argv.slice(2);
  if (!email || !password || password.length < 8) {
    console.error("วิธีใช้: npm run admin:create -- <email> <password อย่างน้อย 8 ตัว> [ชื่อ] [นามสกุล]");
    process.exit(1);
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    create: {
      email: email.toLowerCase(),
      firstName,
      lastName,
      passwordHash,
      role: "ADMIN",
      emailVerifiedAt: new Date(),
      acceptedTermsAt: new Date(),
    },
    update: { role: "ADMIN", passwordHash, emailVerifiedAt: new Date(), bannedAt: null, banReason: "" },
  });
  console.log(`พร้อมใช้งาน: ${user.email} เป็นผู้ดูแลระบบแล้ว เข้าสู่ระบบที่ /login`);
}

await main().finally(() => prisma.$disconnect());
