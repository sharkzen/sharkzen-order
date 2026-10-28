import { PrismaClient } from "@prisma/client";

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

/** ใส่โต๊ะ หมวดหมู่ และเมนูตัวอย่างให้ทุกร้านที่ยังว่าง (ต้องสมัครผู้ใช้ก่อนจึงจะมีร้าน) */
async function main() {
  const shops = await prisma.shop.findMany({ select: { id: true } });
  if (shops.length === 0) console.warn("ยังไม่มีร้าน: สมัครผู้ใช้ก่อนแล้วค่อยรัน seed");

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
