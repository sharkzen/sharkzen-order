import { PrismaClient } from "@prisma/client";
import { hashPassword } from "./lib/crypto.js";
import { DEFAULT_TRIAL_DAYS, SEED_PLANS } from "./lib/plans.js";

const prisma = new PrismaClient();

const TABLES = [
  ...Array.from({ length: 6 }, (_, i) => ({ name: `โต๊ะ ${i + 1}`, zone: "ชั้น 1", seats: i % 2 ? 4 : 2 })),
  ...Array.from({ length: 4 }, (_, i) => ({ name: `โต๊ะ ${i + 7}`, zone: "ริมระเบียง", seats: 4 })),
];

const MENU: { category: string; items: [name: string, price: number, description: string][] }[] = [
  {
    category: "จานเดียว",
    items: [
      ["ข้าวผัดกะเพราไก่ไข่ดาว", 60, "กะเพราไก่สับ ผัดเผ็ดร้อน เสิร์ฟพร้อมไข่ดาว"],
      ["ข้าวผัดกุ้ง", 80, "ข้าวผัดกุ้งสด ไข่ แตงกวา มะนาว"],
    ],
  },
  {
    category: "ต้ม ยำ แกง",
    items: [
      ["ต้มยำกุ้งน้ำข้น", 120, "กุ้งแม่น้ำ เห็ดฟาง น้ำพริกเผา"],
      ["แกงเขียวหวานไก่", 90, "เนื้อไก่ มะเขือพวง ใบโหระพา"],
    ],
  },
  {
    category: "เครื่องดื่ม",
    items: [
      ["ชาไทยเย็น", 35, "ชาไทยเข้ม นมข้นหวาน"],
      ["น้ำมะนาวโซดา", 40, "มะนาวสด โซดา"],
    ],
  },
];

/**
 * Seed ข้อมูลตั้งต้น: รันซ้ำได้เสมอ (ไม่ทับสิ่งที่ผู้ดูแลแก้ไปแล้ว)
 * - ตอนพัฒนา: npm run prisma:seed   - production: container "migrate" รัน dist/seed.js ให้อัตโนมัติทุกครั้งที่ deploy
 *
 * ข้อมูลตั้งต้นของระบบ (รันซ้ำได้ ไม่ทับสิ่งที่ผู้ดูแลแก้ไปแล้ว):
 * แพ็กเกจและราคา ค่าตั้งระบบ และบัญชีผู้ดูแลระบบคนแรก
 * บัญชีแอดมินอ่านจาก SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD; ตอนพัฒนามีค่าเริ่มต้นให้ ส่วน production ต้องตั้งเอง
 */
async function seedSystem() {
  const created = await prisma.plan.createMany({ data: SEED_PLANS, skipDuplicates: true });
  console.log(`แพ็กเกจ: เพิ่มใหม่ ${created.count} จาก ${SEED_PLANS.length} (ที่มีอยู่แล้วไม่ถูกแก้)`);

  const defaults: Record<string, string> = {
    trialDays: String(DEFAULT_TRIAL_DAYS),
    yearlyFreeMonths: "2",
    supportEmail: "support@sharkzen.app",
    supportPhone: "",
    supportLine: "",
  };
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.systemSetting.upsert({ where: { key }, update: {}, create: { key, value } });
  }
  console.log("ค่าตั้งระบบ: พร้อม (วันทดลอง รายปีแถม ช่องทางติดต่อ)");

  const production = process.env.NODE_ENV === "production";
  const email = (process.env.SEED_ADMIN_EMAIL ?? (production ? "" : "admin@sharkzen.local")).trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? (production ? "" : "Aa123456");
  if (!email || !password) {
    console.warn("ข้ามการสร้างแอดมิน: production ต้องตั้ง SEED_ADMIN_EMAIL และ SEED_ADMIN_PASSWORD");
    return;
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`แอดมิน: ${email} มีอยู่แล้ว (ไม่เปลี่ยนรหัสผ่าน)${existing.role === "ADMIN" ? "" : " แต่ยังไม่ใช่ ADMIN ใช้ npm run admin:create เพื่อเลื่อนสิทธิ์"}`);
    return;
  }
  await prisma.user.create({
    data: {
      email,
      firstName: "Admin",
      lastName: "SHARKZEN",
      passwordHash: await hashPassword(password),
      role: "ADMIN",
      emailVerifiedAt: new Date(),
      acceptedTermsAt: new Date(),
    },
  });
  console.log(`แอดมิน: สร้าง ${email} แล้ว เข้าสู่ระบบที่ /login`);
}

/** ใส่โต๊ะ หมวดหมู่ และเมนูตัวอย่างให้ทุกร้านที่ยังว่าง (ต้องสมัครผู้ใช้ก่อนจึงจะมีร้าน) */
async function main() {
  await seedSystem();

  // เมนู/โต๊ะตัวอย่างใส่เฉพาะตอนพัฒนา ห้ามใส่ลงร้านจริงของลูกค้าบน production
  if (process.env.NODE_ENV === "production") return;

  const shops = await prisma.shop.findMany({ select: { id: true } });
  if (shops.length === 0) console.warn("ยังไม่มีร้าน: ข้ามเมนู/โต๊ะตัวอย่าง (สมัครผู้ใช้ก่อนแล้วรัน seed อีกครั้ง)");

  for (const { id: shopId } of shops) {
    if ((await prisma.table.count({ where: { shopId } })) === 0) {
      await prisma.table.createMany({
        data: TABLES.map((table, sortOrder) => ({ ...table, shopId, sortOrder })),
      });
    }

    if ((await prisma.menuItem.count({ where: { shopId } })) === 0) {
      for (const [categoryIndex, group] of MENU.entries()) {
        const category = await prisma.category.upsert({
          where: { shopId_name: { shopId, name: group.category } },
          update: {},
          create: { shopId, name: group.category, sortOrder: categoryIndex },
        });
        await prisma.menuItem.createMany({
          data: group.items.map(([name, price, description], sortOrder) => ({
            shopId,
            categoryId: category.id,
            name,
            price,
            description,
            sortOrder,
          })),
        });
      }
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
