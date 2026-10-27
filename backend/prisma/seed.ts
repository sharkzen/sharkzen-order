import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await Promise.all(
    ["โต๊ะ 1", "โต๊ะ 2", "โต๊ะ 3"].map((name) =>
      prisma.table.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );

  if ((await prisma.menuItem.count()) === 0) {
    await prisma.menuItem.createMany({
      data: [
        { name: "ข้าวผัดกะเพรา", price: 60 },
        { name: "ต้มยำกุ้ง", price: 120 },
        { name: "ชาไทยเย็น", price: 35 },
      ],
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
