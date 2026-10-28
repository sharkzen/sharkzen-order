import type { Bill, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";
import type { PayBillBody } from "@/schemas/cashier.schema.js";
import { startOfDay, todayBangkok } from "@/utils/date.js";
import { AppError, notFound } from "@/utils/errors.js";

const round2 = (n: number) => Math.round(n * 100) / 100;

type TableWithOrders = Prisma.TableGetPayload<{ include: { orders: { include: { items: true } } } }>;

const billDto = (bill: Bill) => ({
  method: bill.method,
  paidAt: bill.paidAt.toISOString(),
  subtotal: Number(bill.subtotal),
  discount: Number(bill.discount),
  serviceCharge: Number(bill.serviceCharge),
  total: Number(bill.total),
  received: bill.received === null ? null : Number(bill.received),
  change: bill.change === null ? null : Number(bill.change),
});

/** บิลหนึ่งโต๊ะ = ทุกรอบสั่งในรอบการใช้โต๊ะปัจจุบัน (ไม่รวมที่ยกเลิก) */
function toBill(table: TableWithOrders, bill: Bill | undefined) {
  const orders = table.orders.filter((order) => order.status !== "CANCELLED");
  // สั่งเพิ่มหลังจ่ายแล้ว: บิลใหม่มีเฉพาะรอบที่ยังไม่ชำระ (รอบที่จ่ายไปแล้วไม่ถูกเรียกเก็บซ้ำ)
  const unpaid = orders.filter((order) => order.paymentStatus === "UNPAID");
  const billable = unpaid.length > 0 ? unpaid : orders;
  return {
    tableId: table.id,
    tableName: table.name,
    zone: table.zone,
    openedAt: table.sessionOpenedAt?.toISOString() ?? null,
    rounds: billable.map((order) => ({
      orderId: order.id,
      number: order.number,
      createdAt: order.createdAt.toISOString(),
      served: order.status === "SERVED",
      lines: order.items
        .map((item) => ({
          name: item.name,
          quantity: item.quantity - item.cancelledQty,
          unitPrice: Number(item.price),
        }))
        .filter((line) => line.quantity > 0),
    })),
    // ถือว่าจ่ายแล้วเมื่อไม่เหลือออเดอร์ค้างชำระ (สั่งเพิ่มหลังจ่ายจะกลับเป็นยังไม่จ่าย)
    payment: bill && orders.every((order) => order.paymentStatus === "PAID") ? billDto(bill) : null,
  };
}

export const cashierService = {
  /** ยอดที่เก็บได้ตั้งแต่ 00:00 วันนี้ (เวลาไทย) ทุกโต๊ะ รวมโต๊ะที่ปิดไปแล้ว */
  async collectedToday(shopId: string) {
    const { _sum } = await prisma.bill.aggregate({
      where: { shopId, paidAt: { gte: startOfDay(todayBangkok()) } },
      _sum: { total: true },
    });
    return Number(_sum.total ?? 0);
  },

  /** บิลของโต๊ะที่เปิดอยู่ทั้งหมด (รวมโต๊ะที่จ่ายแล้วแต่ยังไม่ปิด) */
  async bills(shopId: string) {
    const tables = await prisma.table.findMany({
      where: { shopId, sessionId: { not: null } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        orders: {
          where: { sessionId: { not: null } },
          orderBy: { createdAt: "asc" },
          include: { items: true },
        },
      },
    });
    const sessions = tables.map((table) => table.sessionId as string);
    const bills = await prisma.bill.findMany({ where: { shopId, sessionId: { in: sessions } }, orderBy: { paidAt: "asc" } });
    const bySession = new Map(bills.map((bill) => [bill.sessionId, bill]));

    return {
      collectedToday: await this.collectedToday(shopId),
      bills: tables.map((table) =>
        toBill(
          { ...table, orders: table.orders.filter((o) => o.sessionId === table.sessionId) },
          bySession.get(table.sessionId as string),
        ),
      ),
    };
  },

  /** รับชำระทั้งโต๊ะ คำนวณยอดใหม่ฝั่ง server เสมอ ไม่เชื่อตัวเลขจาก client */
  async pay(shopId: string, tableId: string, body: PayBillBody) {
    const table = await prisma.table.findFirst({ where: { id: tableId, shopId } });
    if (!table) throw notFound("Table");
    if (!table.sessionId) throw new AppError(409, "โต๊ะนี้ยังไม่เปิด", "TABLE_CLOSED");
    const shop = await prisma.shop.findUniqueOrThrow({ where: { id: shopId } });

    const orders = await prisma.order.findMany({
      where: { shopId, sessionId: table.sessionId, status: { not: "CANCELLED" } },
    });
    const unpaid = orders.filter((order) => order.paymentStatus === "UNPAID");
    if (unpaid.length === 0) throw new AppError(409, "โต๊ะนี้ไม่มียอดค้างชำระ", "NOTHING_TO_PAY");

    // ปัดส่วนลดและค่าบริการเป็นบาทเต็ม เหมือนที่หน้าคิดเงินคำนวณ ยอดที่แสดงจึงตรงกับที่บันทึกเสมอ
    const subtotal = round2(unpaid.reduce((sum, order) => sum + Number(order.total), 0));
    const discount = Math.min(Math.max(0, Math.round(body.discount)), Math.round(subtotal));
    const serviceCharge = Math.round(((subtotal - discount) * shop.serviceChargePercent) / 100);
    const total = round2(subtotal - discount + serviceCharge);

    let received: number | null = null;
    let change: number | null = null;
    if (body.method === "CASH") {
      received = body.received ?? total;
      if (received < total) throw new AppError(400, "รับเงินไม่พอ", "INSUFFICIENT_CASH");
      change = round2(received - total);
    }

    const paidAt = new Date();
    const [bill] = await prisma.$transaction([
      prisma.bill.create({
        data: {
          shopId,
          tableId,
          tableName: table.name,
          sessionId: table.sessionId,
          method: body.method,
          subtotal,
          discount,
          serviceCharge,
          total,
          received,
          change,
          paidAt,
        },
      }),
      prisma.order.updateMany({
        where: { id: { in: unpaid.map((order) => order.id) } },
        data: { paymentStatus: "PAID", paymentMethod: body.method, paidAt },
      }),
    ]);
    return { bill: billDto(bill), tableName: table.name, orderIds: unpaid.map((order) => order.id) };
  },
};
