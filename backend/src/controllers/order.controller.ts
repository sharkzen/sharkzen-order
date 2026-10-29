import type { FastifyReply, FastifyRequest } from "fastify";
import {
  cancelItemBodySchema,
  cancelOrderBodySchema,
  createOrderBodySchema,
  listOrdersQuerySchema,
  orderIdParamsSchema,
  orderItemParamsSchema,
  setItemQuantityBodySchema,
  tokenParamsSchema,
  updateOrderStatusBodySchema,
} from "@/schemas/order.schema.js";
import { notificationService } from "@/services/notification.service.js";
import { orderDto, orderService } from "@/services/order.service.js";
import { SocketEvent, emitToTable } from "@/sockets/events.js";
import { shopHandler } from "@/utils/route.js";

/** ตั๋วรอบการนั่งที่หน้าลูกค้าแนบมากับทุกคำสั่งที่เขียนข้อมูลของโต๊ะ */
export const sessionTokenOf = (request: FastifyRequest) => {
  const value = request.headers["x-table-session"];
  return Array.isArray(value) ? value[0] : value;
};

/** กุญแจกันสั่งซ้ำจาก header Idempotency-Key (ไม่ส่ง = ไม่กันซ้ำ) */
const idempotencyKeyOf = (request: FastifyRequest) => {
  const value = request.headers["idempotency-key"];
  const key = Array.isArray(value) ? value[0] : value;
  return key && /^[\w-]{8,64}$/.test(key) ? key : undefined;
};

export const orderController = {
  list: shopHandler(({ shopId, request }) =>
    orderService.list(shopId, listOrdersQuerySchema.parse(request.query)),
  ),

  get: shopHandler(async ({ shopId, request }) => {
    const { id } = orderIdParamsSchema.parse(request.params);
    return orderDto(await orderService.getById(shopId, id));
  }),

  /** ลูกค้าสั่งเอง ไม่ล็อกอิน จึงไม่ใช้ shopHandler */
  async create(request: FastifyRequest, reply: FastifyReply) {
    const { order: created, duplicate } = await orderService.create(
      tokenParamsSchema.parse(request.params).token,
      createOrderBodySchema.parse(request.body),
      sessionTokenOf(request),
      idempotencyKeyOf(request),
    );
    const order = orderDto(created);
    // ส่งซ้ำ: คืนออเดอร์เดิมเงียบๆ ไม่แจ้งร้านหรือครัวซ้ำ
    if (duplicate) return reply.code(200).send(order);
    const io = request.server.io;
    emitToTable(io, order.tableId);
    io.to(`shop:${order.shopId}`).emit(SocketEvent.OrderCreated, order);
    io.to(`shop:${order.shopId}`).emit(SocketEvent.TablesChanged);
    const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
    await notificationService.push(io, order.shopId, {
      type: "ORDER_NEW",
      title: `ออเดอร์ใหม่ ${order.code} • ${order.table}`,
      body: `${count} รายการ • ฿${order.total.toLocaleString("th-TH")}`,
      href: "/orders",
    });
    return reply.code(201).send(order);
  },

  updateStatus: shopHandler(async ({ shopId, request, emit }) => {
    const { id } = orderIdParamsSchema.parse(request.params);
    const { status } = updateOrderStatusBodySchema.parse(request.body);
    const order = orderDto(await orderService.updateStatus(shopId, id, status));
    emit(SocketEvent.OrderUpdated, order);
    return order;
  }),

  cancel: shopHandler(async ({ shopId, request, emit, io }) => {
    const { id } = orderIdParamsSchema.parse(request.params);
    const { reason, fromKitchen } = cancelOrderBodySchema.parse(request.body);
    const order = orderDto(await orderService.cancel(shopId, id, reason, fromKitchen));
    emit(SocketEvent.OrderUpdated, order);
    emit(SocketEvent.TablesChanged);
    await notificationService.push(io, shopId, {
      type: "ORDER_CANCELLED",
      title: `${fromKitchen ? "ครัวยกเลิก" : "ยกเลิก"}ออเดอร์ ${order.code} • ${order.table}`,
      body: `${reason}${fromKitchen && order.paymentStatus === "PAID" ? " • ชำระแล้ว ต้องคืนเงินลูกค้า" : ""}`,
      href: "/orders",
    });
    return order;
  }),

  cancelItem: shopHandler(async ({ shopId, request, emit }) => {
    const { id, itemId } = orderItemParamsSchema.parse(request.params);
    const { quantity, reason, fromKitchen } = cancelItemBodySchema.parse(request.body);
    const order = orderDto(await orderService.cancelItem(shopId, id, itemId, quantity, reason, fromKitchen));
    emit(SocketEvent.OrderUpdated, order);
    emit(SocketEvent.TablesChanged);
    return order;
  }),

  setItemQuantity: shopHandler(async ({ shopId, request, emit }) => {
    const { id, itemId } = orderItemParamsSchema.parse(request.params);
    const { quantity } = setItemQuantityBodySchema.parse(request.body);
    const order = orderDto(await orderService.setItemQuantity(shopId, id, itemId, quantity));
    emit(SocketEvent.OrderUpdated, order);
    emit(SocketEvent.TablesChanged);
    return order;
  }),

  /** ครัวกดรับทราบว่าออเดอร์ที่หน้าร้านยกเลิกแล้ว (การ์ดแดงหายจากกระดาน) */
  ackCancel: shopHandler(async ({ shopId, request, emit }) => {
    const { id } = orderIdParamsSchema.parse(request.params);
    const order = orderDto(await orderService.ackCancel(shopId, id));
    emit(SocketEvent.OrderUpdated, order);
    return order;
  }),
};
