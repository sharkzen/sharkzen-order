import { Prisma, type OrderStatus } from "@prisma/client";
import { generateOrderCode, isCodeCollision } from "@/lib/order-code.js";
import { prisma } from "@/lib/prisma.js";
import { optionGroupsSchema, type OptionGroup } from "@/schemas/menu.schema.js";
import { assertTableSession, findTableByToken } from "@/services/table.service.js";
import type { CreateOrderBody, ListOrdersQuery } from "@/schemas/order.schema.js";
import { shiftDate, startOfDay, todayBangkok } from "@/utils/date.js";
import { AppError, notFound } from "@/utils/errors.js";

const include = { table: true, items: true } as const;
type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof include }>;

const ACTIVE: OrderStatus[] = ["NEW", "PREPARING", "READY"];

/** ออเดอร์ที่ครัวยังไม่รับของโต๊ะเดียวกันได้ค้างพร้อมกันไม่เกินนี้ (กันสแปม ลูกค้าสั่งรอบใหม่ได้ทันทีที่ครัวรับ) */
export const MAX_WAITING_PER_TABLE = 10;

export const orderDto = (order: OrderWithRelations) => ({
  id: order.id,
  code: order.code,
  createdAt: order.createdAt.toISOString(),
  shopId: order.shopId,
  tableId: order.tableId,
  table: order.table.name,
  zone: order.table.zone,
  sessionId: order.sessionId,
  status: order.status,
  paymentStatus: order.paymentStatus,
  paymentMethod: order.paymentMethod,
  paidAt: order.paidAt?.toISOString() ?? null,
  total: Number(order.total),
  notes: order.notes,
  cancelReason: order.cancelReason,
  /** เวลาที่เข้าสถานะปัจจุบัน */
  statusChangedAt: order.statusChangedAt.toISOString(),
  /** ครัวรับทราบการยกเลิกแล้ว */
  kitchenAck: order.kitchenAckAt !== null,
  items: order.items.map((item) => ({
    id: item.id,
    menuItemId: item.menuItemId,
    name: item.name,
    price: Number(item.price),
    quantity: item.quantity,
    /** ตัวเลือกที่ลูกค้าเลือก (price ของรายการรวมราคาตัวเลือกแล้ว) */
    options: (Array.isArray(item.options) ? item.options : []) as { group: string; name: string; price: number }[],
    note: item.note,
    cancelledQty: item.cancelledQty,
    cancelReason: item.cancelReason,
  })),
});
export type OrderDto = ReturnType<typeof orderDto>;

/** ออเดอร์ของรอบโต๊ะปัจจุบัน ให้ลูกค้าดูสถานะ (ไม่มีข้อมูลภายในร้าน) */
export async function listSessionOrders(shopId: string, sessionId: string) {
  const orders = await prisma.order.findMany({
    where: { shopId, sessionId },
    include,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return orders.map((order) => ({
    id: order.id,
    code: order.code,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    total: Number(order.total),
    cancelReason: order.cancelReason,
    items: order.items
      .filter((item) => item.quantity - item.cancelledQty > 0)
      .map((item) => ({
        id: item.id,
        name: item.name,
        options: (Array.isArray(item.options) ? (item.options as { name: string }[]) : []).map((option) => option.name),
        note: item.note,
        quantity: item.quantity - item.cancelledQty,
      })),
  }));
}

/** ตรวจตัวเลือกที่ลูกค้าเลือกกับกติกาของเมนู แล้วคืนตัวเลือกที่เลือกพร้อมราคาที่บวกเพิ่ม ราคาคิดจากข้อมูลบน server เสมอ */
function pickOptions(menuName: string, groups: OptionGroup[], optionIds: string[]) {
  const chosen = new Set(optionIds);
  if (chosen.size !== optionIds.length) throw new AppError(400, "ตัวเลือกซ้ำกัน", "OPTION_INVALID");
  const picked: { group: string; name: string; price: number }[] = [];
  for (const group of groups) {
    const selected = group.options.filter((option) => chosen.has(option.id));
    const soldOut = selected.find((option) => !option.available);
    if (soldOut) throw new AppError(400, `${soldOut.name} หมดชั่วคราว`, "OPTION_UNAVAILABLE");
    if (group.required && selected.length === 0) {
      throw new AppError(400, `${menuName}: กรุณาเลือก${group.name}`, "OPTION_REQUIRED");
    }
    if (group.type === "single" && selected.length > 1) {
      throw new AppError(400, `${menuName}: ${group.name} เลือกได้ข้อเดียว`, "OPTION_INVALID");
    }
    if (group.type === "multiple" && group.max !== null && selected.length > group.max) {
      throw new AppError(400, `${menuName}: ${group.name} เลือกได้ไม่เกิน ${group.max} ข้อ`, "OPTION_INVALID");
    }
    picked.push(...selected.map((option) => ({ group: group.name, name: option.name, price: option.price })));
  }
  if (picked.length !== chosen.size) throw new AppError(400, "ตัวเลือกไม่ถูกต้อง", "OPTION_INVALID");
  return picked;
}

/** สร้างออเดอร์จากรายการที่เลือก: ราคาและตัวเลือกคิดจากข้อมูลเมนูบน server เสมอ */
async function createOrder(
  shopId: string,
  tableId: string,
  sessionId: string,
  notes: string[],
  items: CreateOrderBody["items"],
  /** เพิ่มโดยแคชเชียร์: ข้ามครัว (ถือว่าเสิร์ฟแล้ว และครัวไม่ต้องรับทราบถ้าถูกยกเลิก) */
  byStaff = false,
  idempotencyKey?: string,
) {
  const ids = [...new Set(items.map((item) => item.menuItemId))];
  const menuItems = await prisma.menuItem.findMany({ where: { id: { in: ids }, shopId, deletedAt: null } });
  const byId = new Map(menuItems.map((menuItem) => [menuItem.id, menuItem]));

  const lines = items.map((item) => {
    const menuItem = byId.get(item.menuItemId);
    if (!menuItem) throw new AppError(400, "ไม่พบเมนูที่สั่ง", "MENU_NOT_FOUND");
    if (!menuItem.available) throw new AppError(400, `${menuItem.name} หมดชั่วคราว`, "MENU_UNAVAILABLE");
    const options = pickOptions(menuItem.name, optionGroupsSchema.catch([]).parse(menuItem.optionGroups), item.options);
    return {
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: Number(menuItem.price) + options.reduce((sum, option) => sum + option.price, 0),
      options,
      note: item.note,
      quantity: item.quantity,
    };
  });
  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  // รหัสสุ่มชนกันได้น้อยมาก ถ้าชนให้สุ่มใหม่
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.order.create({
        data: {
          code: generateOrderCode(),
          idempotencyKey,
          shopId,
          tableId,
          sessionId,
          notes,
          total,
          items: { create: lines },
          ...(byStaff && { status: "SERVED", kitchenAckAt: new Date() }),
        },
        include,
      });
    } catch (error) {
      if (attempt >= 4 || !isCodeCollision(error)) throw error;
    }
  }
}

export const orderService = {
  async list(shopId: string, { status, from, to, active, kitchen, q }: ListOrdersQuery) {
    if (kitchen === "true") return this.listForKitchen(shopId);
    if (q) {
      const orders = await prisma.order.findMany({
        where: {
          shopId,
          status,
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            { table: { name: { contains: q, mode: "insensitive" } } },
          ],
        },
        include,
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return orders.map(orderDto);
    }
    const range =
      active === "true"
        ? undefined
        : {
            gte: startOfDay(from ?? todayBangkok()),
            lt: startOfDay(shiftDate(to ?? from ?? todayBangkok(), 1)),
          };
    const orders = await prisma.order.findMany({
      where: {
        shopId,
        status: active === "true" ? { in: ACTIVE } : status,
        createdAt: range,
      },
      include,
      orderBy: { createdAt: active === "true" ? "asc" : "desc" },
      take: 1000,
    });
    return orders.map(orderDto);
  },

  /** งานของครัว: ที่ยังไม่จบทั้งหมด + ที่ถูกยกเลิกภายใน 24 ชม. และครัวยังไม่กดรับทราบ */
  async listForKitchen(shopId: string) {
    const since = new Date(Date.now() - 24 * 3600_000);
    const orders = await prisma.order.findMany({
      where: {
        shopId,
        OR: [
          { status: { in: ACTIVE } },
          { status: "CANCELLED", kitchenAckAt: null, updatedAt: { gte: since } },
        ],
      },
      include,
      orderBy: { createdAt: "asc" },
      take: 500,
    });
    return orders.map(orderDto);
  },

  async ackCancel(shopId: string, id: string) {
    const order = await this.getById(shopId, id);
    if (order.status !== "CANCELLED" || order.kitchenAckAt) return order;
    return prisma.order.update({ where: { id }, data: { kitchenAckAt: new Date() }, include });
  },

  async getById(shopId: string, id: string) {
    const order = await prisma.order.findFirst({ where: { id, shopId }, include });
    if (!order) throw notFound("Order");
    return order;
  },

  /**
   * ลูกค้าสั่งผ่าน QR (ไม่ต้องล็อกอิน) ถอดร้านและโต๊ะจาก token
   * สั่งไม่ได้ถ้าร้านปิดรับออเดอร์ หรือโต๊ะยังไม่เปิดรอบ และเมนูต้องเป็นของร้านเดียวกัน
   */
  async create(token: string, { notes, items }: CreateOrderBody, sessionToken?: string, idempotencyKey?: string) {
    const table = await findTableByToken(token);
    const tableId = table.id;
    if (!table.shop.isOpen) throw new AppError(403, "ร้านปิดรับออเดอร์ชั่วคราว", "SHOP_CLOSED");
    assertTableSession(table, sessionToken);

    // ส่งซ้ำด้วยกุญแจเดิม (กดรัว/เน็ตหลุดแล้วลองใหม่) ได้ออเดอร์เดิมคืน ไม่สร้างใหม่
    if (idempotencyKey) {
      const existing = await prisma.order.findFirst({ where: { idempotencyKey, tableId }, include });
      if (existing) return { order: existing, duplicate: true };
    }

    const waiting = await prisma.order.count({
      where: { shopId: table.shopId, sessionId: table.sessionId, status: "NEW" },
    });
    if (waiting >= MAX_WAITING_PER_TABLE) {
      throw new AppError(429, "มีออเดอร์รอครัวรับอยู่หลายรายการแล้ว กรุณารอสักครู่แล้วสั่งต่อ", "TOO_MANY_WAITING");
    }

    try {
      const order = await createOrder(table.shopId, tableId, table.sessionId as string, notes, items, false, idempotencyKey);
      return { order, duplicate: false };
    } catch (error) {
      // สองคำขอที่กุญแจเดียวกันมาพร้อมกัน: ตัวหลังชน unique แล้วคืนออเดอร์ที่ตัวแรกสร้าง
      if (idempotencyKey && error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existing = await prisma.order.findFirst({ where: { idempotencyKey, tableId }, include });
        if (existing) return { order: existing, duplicate: true };
      }
      throw error;
    }
  },

  /** แคชเชียร์เพิ่มเมนูให้โต๊ะที่เปิดอยู่ (สร้างเป็นออเดอร์ใหม่ของรอบโต๊ะนั้น สถานะเสิร์ฟแล้ว ไม่ขึ้นหน้าจอครัว) */
  async addByStaff(shopId: string, tableId: string, items: CreateOrderBody["items"]) {
    const table = await prisma.table.findFirst({ where: { id: tableId, shopId } });
    if (!table) throw notFound("Table");
    if (!table.sessionId) throw new AppError(409, "โต๊ะนี้ยังไม่เปิด", "TABLE_CLOSED");
    return createOrder(shopId, tableId, table.sessionId, [], items, true);
  },

  /**
   * แคชเชียร์ตั้งจำนวนจานของรายการ (คงเหลือหลังหักที่ยกเลิก) เพิ่มได้โดยเพิ่ม quantity ลดได้โดยบันทึกเป็นการยกเลิกบางจาน
   * ออเดอร์ที่ชำระแล้วแก้ไม่ได้
   */
  async setItemQuantity(shopId: string, id: string, itemId: string, target: number) {
    const order = await this.getById(shopId, id);
    if (order.status === "CANCELLED") throw new AppError(409, "ออเดอร์นี้ถูกยกเลิกแล้ว", "ORDER_CANCELLED");
    if (order.paymentStatus === "PAID") throw new AppError(409, "ออเดอร์ที่ชำระแล้วแก้ไขไม่ได้", "ORDER_PAID");
    const item = order.items.find((line) => line.id === itemId);
    if (!item) throw notFound("Order item");
    const left = item.quantity - item.cancelledQty;
    if (target === left) return order;
    if (target < left) return this.cancelItem(shopId, id, itemId, left - target, "แคชเชียร์ปรับจำนวน");

    const total = order.items.reduce(
      (sum, line) => sum + Number(line.price) * (line.id === itemId ? target : line.quantity - line.cancelledQty),
      0,
    );
    return prisma.$transaction(async (tx) => {
      await tx.orderItem.update({ where: { id: itemId }, data: { quantity: item.quantity + (target - left) } });
      return tx.order.update({ where: { id }, data: { total }, include });
    });
  },

  async updateStatus(shopId: string, id: string, status: OrderStatus) {
    const order = await this.getById(shopId, id);
    if (order.status === "CANCELLED") throw new AppError(409, "ออเดอร์นี้ถูกยกเลิกแล้ว", "ORDER_CANCELLED");
    if (order.status === status) return order;
    return prisma.order.update({ where: { id }, data: { status, statusChangedAt: new Date() }, include });
  },

  async cancel(shopId: string, id: string, reason: string, fromKitchen = false) {
    const order = await this.getById(shopId, id);
    if (order.status === "CANCELLED") return order;
    if (order.paymentStatus === "PAID" && !fromKitchen) {
      throw new AppError(409, "ออเดอร์ที่ชำระแล้วยกเลิกไม่ได้", "ORDER_PAID");
    }
    // ชำระแล้วแต่ครัวยกเลิก: ยอดที่เหลือของออเดอร์ต้องคืนลูกค้า บันทึกไว้หักออกจากยอดเก็บเงิน
    const refund = order.paymentStatus === "PAID" ? Number(order.total) : 0;
    return prisma.order.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelReason: reason,
        statusChangedAt: new Date(),
        ...(fromKitchen && { kitchenAckAt: new Date() }),
        ...(refund > 0 && { refunds: { create: { shopId, amount: refund, reason } } }),
      },
      include,
    });
  },

  /** ครัว/หน้าร้านยกเลิกบางจานของรายการ (เช่น วัตถุดิบหมด) ยอดรวมของออเดอร์คำนวณใหม่ */
  async cancelItem(shopId: string, id: string, itemId: string, quantity: number, reason: string, fromKitchen = false) {
    const order = await this.getById(shopId, id);
    if (order.status === "CANCELLED") throw new AppError(409, "ออเดอร์นี้ถูกยกเลิกแล้ว", "ORDER_CANCELLED");
    if (order.paymentStatus === "PAID" && !fromKitchen) {
      throw new AppError(409, "ออเดอร์ที่ชำระแล้วแก้ไขไม่ได้", "ORDER_PAID");
    }
    const item = order.items.find((line) => line.id === itemId);
    if (!item) throw notFound("Order item");
    const left = item.quantity - item.cancelledQty;
    if (quantity > left) throw new AppError(400, `ยกเลิกได้ไม่เกิน ${left} จาน`);

    const remaining = order.items.map((line) =>
      line.id === itemId
        ? line.quantity - line.cancelledQty - quantity
        : line.quantity - line.cancelledQty,
    );
    const allCancelled = remaining.every((qty) => qty <= 0);
    const total = order.items.reduce(
      (sum, line, index) => sum + Number(line.price) * Math.max(remaining[index] ?? 0, 0),
      0,
    );

    return prisma.$transaction(async (tx) => {
      await tx.orderItem.update({
        where: { id: itemId },
        data: { cancelledQty: item.cancelledQty + quantity, cancelReason: reason },
      });
      return tx.order.update({
        where: { id },
        data: {
          total,
          // ชำระแล้วแต่ครัวยกเลิกบางจาน: คืนเงินเท่าราคาจานที่ยกเลิก
          ...(order.paymentStatus === "PAID" && {
            refunds: { create: { shopId, amount: Number(item.price) * quantity, reason } },
          }),
          ...(allCancelled && {
            status: "CANCELLED",
            cancelReason: reason,
            statusChangedAt: new Date(),
            ...(fromKitchen && { kitchenAckAt: new Date() }),
          }),
        },
        include,
      });
    });
  },
};
