import type { NotificationType } from "@prisma/client";
import type { Server } from "socket.io";
import { prisma } from "@/lib/prisma.js";
import { notFound } from "@/utils/errors.js";
import { SocketEvent, shopRoom } from "@/sockets/events.js";

const toDto = (n: {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
}) => ({
  id: n.id,
  type: n.type,
  title: n.title,
  body: n.body,
  href: n.href,
  read: n.readAt !== null,
  createdAt: n.createdAt.toISOString(),
});

export const notificationService = {
  /** บันทึกแล้วส่งเข้าห้องร้านทันที (กระดิ่งบน header อัปเดตเอง) */
  async push(
    io: Server,
    shopId: string,
    input: { type: NotificationType; title: string; body?: string; href?: string },
  ) {
    const row = await prisma.notification.create({
      data: { shopId, body: "", ...input },
    });
    const dto = toDto(row);
    io.to(shopRoom(shopId)).emit(SocketEvent.NotificationCreated, dto);
    return dto;
  },

  /**
   * หน้าละ limit รายการ เรียงใหม่สุดก่อน ส่ง after = id รายการสุดท้ายของหน้าก่อนเพื่อขอหน้าถัดไป
   * ไม่รวมออเดอร์ใหม่ เพราะมีหน้าคำสั่งซื้อและครัวอยู่แล้ว
   */
  async list(shopId: string, limit = 15, after?: string) {
    const where = { shopId, type: { not: "ORDER_NEW" as const } };
    const [rows, unread] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...(after && { cursor: { id: after }, skip: 1 }),
      }),
      prisma.notification.count({ where: { ...where, readAt: null } }),
    ]);
    return { items: rows.slice(0, limit).map(toDto), unread, hasMore: rows.length > limit };
  },

  async markRead(shopId: string, id: string) {
    const { count } = await prisma.notification.updateMany({
      where: { id, shopId, readAt: null },
      data: { readAt: new Date() },
    });
    if (count === 0 && !(await prisma.notification.findFirst({ where: { id, shopId } })))
      throw notFound("Notification");
  },

  async markAllRead(shopId: string) {
    await prisma.notification.updateMany({
      where: { shopId, readAt: null },
      data: { readAt: new Date() },
    });
  },
};
