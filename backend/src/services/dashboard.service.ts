import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";
import { bangkok, shiftDate, startOfDay } from "@/utils/date.js";
import { daysBetween, type DashboardQuery } from "@/schemas/dashboard.schema.js";

const ACTIVE_STATUSES = ["NEW", "PREPARING", "READY"] as const;
const MONTH_BUCKET_FROM_DAYS = 93;

export type Granularity = "hour" | "day" | "month";

function pickGranularity(days: number): Granularity {
  if (days === 1) return "hour";
  return days <= MONTH_BUCKET_FROM_DAYS ? "day" : "month";
}

function bucketKey(date: Date, granularity: Granularity) {
  const iso = bangkok(date).toISOString();
  if (granularity === "hour") return iso.slice(11, 13);
  return granularity === "day" ? iso.slice(0, 10) : iso.slice(0, 7);
}

/** รายการ bucket ทั้งหมดของช่วง รวมช่วงที่ไม่มียอด เพื่อให้กราฟต่อเนื่อง */
function bucketKeys(from: string, to: string, granularity: Granularity) {
  if (granularity === "hour")
    return Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
  const days = daysBetween(from, to);
  const keys = new Set<string>();
  for (let i = 0; i < days; i++) {
    const day = shiftDate(from, i);
    keys.add(granularity === "day" ? day : day.slice(0, 7));
  }
  return [...keys];
}

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { table: true; items: true };
}>;

/** ยอดขายนับเฉพาะออเดอร์ที่ชำระแล้วและไม่ถูกยกเลิก */
const isSale = (order: OrderWithRelations) =>
  order.paymentStatus === "PAID" && order.status !== "CANCELLED";

function summarize(orders: OrderWithRelations[]) {
  const sales = orders.filter(isSale);
  const revenue = sales.reduce((sum, order) => sum + Number(order.total), 0);
  return {
    revenue,
    orders: orders.length,
    paidOrders: sales.length,
    averageOrder: sales.length ? revenue / sales.length : 0,
  };
}

function findOrders(
  shopId: string,
  { from, to, status, payment }: DashboardQuery,
  rangeFrom = from,
  rangeTo = to,
) {
  return prisma.order.findMany({
    where: {
      shopId,
      createdAt: {
        gte: startOfDay(rangeFrom),
        lt: startOfDay(shiftDate(rangeTo, 1)),
      },
      status,
      paymentStatus: payment,
    },
    include: { table: true, items: true },
    orderBy: { createdAt: "desc" },
  });
}

export const dashboardService = {
  async overview(shopId: string, query: DashboardQuery) {
    const { from, to } = query;
    const days = daysBetween(from, to);
    const granularity = pickGranularity(days);

    // ช่วงก่อนหน้ายาวเท่ากัน ใช้เทียบเปอร์เซ็นต์การเปลี่ยนแปลง
    const previousTo = shiftDate(from, -1);
    const previousFrom = shiftDate(previousTo, -(days - 1));

    const [orders, previousOrders, totalTables, occupiedTables] = await Promise.all([
      findOrders(shopId, query),
      findOrders(shopId, query, previousFrom, previousTo),
      prisma.table.count({ where: { shopId } }),
      prisma.order.findMany({
        where: {
          shopId,
          status: { in: [...ACTIVE_STATUSES] },
          paymentStatus: "UNPAID",
        },
        distinct: ["tableId"],
        select: { tableId: true },
      }),
    ]);

    const series = new Map(bucketKeys(from, to, granularity).map((key) => [key, 0]));
    for (const order of orders.filter(isSale)) {
      const key = bucketKey(order.createdAt, granularity);
      series.set(key, (series.get(key) ?? 0) + Number(order.total));
    }

    const statusCounts = new Map<string, number>();
    for (const order of orders)
      statusCounts.set(order.status, (statusCounts.get(order.status) ?? 0) + 1);

    const menus = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const order of orders.filter((o) => o.status !== "CANCELLED")) {
      for (const item of order.items) {
        const quantity = item.quantity - item.cancelledQty;
        if (quantity <= 0) continue;
        const entry = menus.get(item.menuItemId) ?? {
          name: item.name,
          quantity: 0,
          revenue: 0,
        };
        entry.quantity += quantity;
        entry.revenue += quantity * Number(item.price);
        menus.set(item.menuItemId, entry);
      }
    }

    // เมนูขายดี 5 อันดับแรก พร้อมรูปปัจจุบันของเมนู (ออเดอร์เก็บแค่ชื่อกับราคาตอนสั่ง)
    const popular = [...menus.entries()].sort(([, a], [, b]) => b.quantity - a.quantity).slice(0, 5);
    const images = new Map(
      (
        await prisma.menuItem.findMany({
          where: { shopId, id: { in: popular.map(([id]) => id) } },
          select: { id: true, image: true },
        })
      ).map((item) => [item.id, item.image]),
    );

    return {
      range: { from, to, days, granularity },
      generatedAt: new Date().toISOString(),
      summary: summarize(orders),
      previous: summarize(previousOrders),
      tables: { occupied: occupiedTables.length, total: totalTables },
      series: [...series].map(([key, amount]) => ({ key, amount })),
      statuses: ["NEW", "PREPARING", "READY", "SERVED", "CANCELLED"].map((status) => ({
        status,
        count: statusCounts.get(status) ?? 0,
      })),
      popular: popular.map(([id, menu]) => ({ ...menu, image: images.get(id) ?? "" })),
      recent: orders.slice(0, 6).map((order) => ({
        id: order.id,
        code: order.code,
        createdAt: order.createdAt.toISOString(),
        table: order.table.name,
        total: Number(order.total),
        status: order.status,
      })),
    };
  },
};
