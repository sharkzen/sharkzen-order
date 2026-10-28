import { prisma } from "@/lib/prisma.js";
import type { ReportQuery } from "@/schemas/report.schema.js";
import { bangkok, shiftDate, startOfDay, todayBangkok } from "@/utils/date.js";

type Method = "cash" | "transfer" | "counter";
const METHOD_KEY = { CASH: "cash", TRANSFER: "transfer", COUNTER: "counter" } as const;

export const reportService = {
  /**
   * ยอดขายรายวันย้อนหลัง นับเฉพาะออเดอร์ที่ชำระแล้วและไม่ถูกยกเลิก
   * จัดกลุ่มตามเวลาไทย: รายชั่วโมง (24 ช่อง) เมนูที่ขายได้ และช่องทางชำระเงิน
   */
  async sales(shopId: string, { days }: ReportQuery) {
    const today = todayBangkok();
    const first = shiftDate(today, -(days - 1));
    const orders = await prisma.order.findMany({
      where: {
        shopId,
        paymentStatus: "PAID",
        status: { not: "CANCELLED" },
        createdAt: { gte: startOfDay(first), lt: startOfDay(shiftDate(today, 1)) },
      },
      include: { items: true },
    });

    const byDate = new Map(
      Array.from({ length: days }, (_, i) => {
        const date = shiftDate(first, i);
        return [
          date,
          {
            date,
            hours: Array.from({ length: 24 }, () => ({ revenue: 0, orders: 0 })),
            menu: new Map<string, { name: string; quantity: number; revenue: number }>(),
            methods: { cash: 0, transfer: 0, counter: 0 } as Record<Method, number>,
          },
        ] as const;
      }),
    );

    for (const order of orders) {
      const local = bangkok(order.createdAt);
      const day = byDate.get(local.toISOString().slice(0, 10));
      if (!day) continue;
      const total = Number(order.total);
      const slot = day.hours[local.getUTCHours()];
      if (slot) {
        slot.revenue += total;
        slot.orders += 1;
      }
      day.methods[METHOD_KEY[order.paymentMethod]] += total;
      for (const item of order.items) {
        const quantity = item.quantity - item.cancelledQty;
        if (quantity <= 0) continue;
        const entry = day.menu.get(item.menuItemId) ?? { name: item.name, quantity: 0, revenue: 0 };
        entry.quantity += quantity;
        entry.revenue += quantity * Number(item.price);
        day.menu.set(item.menuItemId, entry);
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      days: [...byDate.values()].map((day) => ({
        date: day.date,
        hours: day.hours,
        menu: [...day.menu.values()],
        methods: day.methods,
      })),
    };
  },
};
