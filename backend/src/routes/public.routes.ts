import type { FastifyPluginAsync } from "fastify";
import { orderController } from "@/controllers/order.controller.js";
import { prisma } from "@/lib/prisma.js";
import { notificationService } from "@/services/notification.service.js";
import { optionGroupsSchema } from "@/schemas/menu.schema.js";
import { tokenParamsSchema } from "@/schemas/order.schema.js";
import { listSessionOrders } from "@/services/order.service.js";
import { findTableByToken } from "@/services/table.service.js";

type DayHours = { open: boolean; from: string; to: string };

/** เวลาเปิด-ปิดของวันนี้ (เวลาไทย) hours เรียงจันทร์ถึงอาทิตย์ */
function todayHours(hours: unknown) {
  if (!Array.isArray(hours) || hours.length !== 7) return null;
  const weekday = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Bangkok", weekday: "short" });
  const index = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(weekday);
  const day = hours[index] as DayHours | undefined;
  return day?.open ? `${day.from}–${day.to} น.` : null;
}

/** ฝั่งลูกค้าหลังสแกน QR ที่โต๊ะ (ไม่ต้องล็อกอิน) ทุกเส้นระบุร้าน/โต๊ะด้วย token เข้ารหัสใน URL */
export const publicRoutes: FastifyPluginAsync = async (app) => {
  app.get("/t/:token", async (request) => {
    const { token } = tokenParamsSchema.parse(request.params);
    const table = await findTableByToken(token);
    const { shop } = table;

    const [categories, items] = await Promise.all([
      prisma.category.findMany({
        where: { shopId: table.shopId, visible: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.menuItem.findMany({
        where: { shopId: table.shopId, deletedAt: null, OR: [{ categoryId: null }, { category: { visible: true } }] },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    // ลูกค้าสั่งได้ก็ต่อเมื่อร้านเปิดรับออเดอร์และโต๊ะถูกเปิดรอบแล้ว
    const blocked = !shop.isOpen ? "SHOP_CLOSED" : table.sessionId === null ? "TABLE_CLOSED" : null;

    return {
      shop: { name: shop.name, branch: shop.branch, hours: todayHours(shop.hours), coverImage: shop.coverImage },
      table: { name: table.name, zone: table.zone },
      canOrder: blocked === null,
      blocked,
      categories: categories.map(({ id, name }) => ({ id, name })),
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        image: item.image,
        available: item.available,
        categoryId: item.categoryId,
        optionGroups: optionGroupsSchema.catch([]).parse(item.optionGroups),
      })),
    };
  });

  app.get("/t/:token/orders", async (request) => {
    const { token } = tokenParamsSchema.parse(request.params);
    const table = await findTableByToken(token);
    return table.sessionId ? listSessionOrders(table.shopId, table.sessionId) : [];
  });

  app.post(
    "/t/:token/orders",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    orderController.create,
  );

  /** ลูกค้ากดเรียกพนักงาน: แจ้งเตือนเข้าแดชบอร์ดของร้าน */
  app.post(
    "/t/:token/call-staff",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const { token } = tokenParamsSchema.parse(request.params);
      const table = await findTableByToken(token);
      await notificationService.push(request.server.io, table.shopId, {
        type: "STAFF_CALL",
        title: `${table.name} เรียกพนักงาน`,
        body: table.zone,
        href: "/tables",
      });
      return reply.code(204).send();
    },
  );
};
