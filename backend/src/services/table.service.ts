import { randomUUID } from "node:crypto";
import type { Table } from "@prisma/client";
import { billingService } from "@/services/billing.service.js";
import { prisma } from "@/lib/prisma.js";
import { decodeTableToken, encodeTableToken } from "@/lib/table-token.js";
import type { CreateTablesBody, UpdateTableBody } from "@/schemas/table.schema.js";
import { AppError, notFound } from "@/utils/errors.js";

export const tableDto = (table: Table) => ({
  id: table.id,
  /** token เข้ารหัสที่ฝังใน QR (ลูกค้าเข้า /t/{token}) */
  token: encodeTableToken(table.shopId, table.id),
  name: table.name,
  zone: table.zone,
  seats: table.seats,
  session:
    table.sessionId && table.sessionOpenedAt
      ? { id: table.sessionId, openedAt: table.sessionOpenedAt.getTime() }
      : null,
});

async function findTable(shopId: string, id: string) {
  const table = await prisma.table.findFirst({ where: { id, shopId } });
  if (!table) throw notFound("Table");
  return table;
}

/** ออเดอร์ของรอบนี้ที่ยังไม่ถูกยกเลิก */
const liveOrders = (shopId: string, sessionId: string) =>
  prisma.order.findMany({
    where: { shopId, sessionId, status: { not: "CANCELLED" } },
    select: { paymentStatus: true },
  });

/** หาโต๊ะ (พร้อมร้าน) จาก token ใน QR ไม่พบหรือ token ปลอม = 404 */
export async function findTableByToken(token: string) {
  const decoded = decodeTableToken(token);
  const table = decoded
    ? await prisma.table.findFirst({
        where: { id: decoded.tableId, shopId: decoded.shopId },
        include: { shop: true },
      })
    : null;
  if (!table) throw new AppError(404, "ไม่พบโต๊ะนี้ กรุณาสแกน QR ที่โต๊ะใหม่อีกครั้ง", "TABLE_NOT_FOUND");
  return table;
}

export const tableService = {
  async list(shopId: string) {
    const tables = await prisma.table.findMany({
      where: { shopId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return tables.map(tableDto);
  },

  async create(shopId: string, { prefix, start, count, zone, seats }: CreateTablesBody) {
    await billingService.assertWithinLimit(shopId, "tables", count);
    const names = Array.from({ length: count }, (_, i) => `${prefix} ${start + i}`);
    const clash = await prisma.table.findFirst({ where: { shopId, name: { in: names } } });
    if (clash) throw new AppError(409, `มี "${clash.name}" อยู่แล้ว`, "DUPLICATE_TABLE");

    const last = await prisma.table.aggregate({ where: { shopId }, _max: { sortOrder: true } });
    const base = (last._max.sortOrder ?? -1) + 1;
    await prisma.table.createMany({
      data: names.map((name, i) => ({ shopId, name, zone, seats, sortOrder: base + i })),
    });
    const created = await prisma.table.findMany({
      where: { shopId, name: { in: names } },
      orderBy: { sortOrder: "asc" },
    });
    return created.map(tableDto);
  },

  async update(shopId: string, id: string, { name, zone, seats }: UpdateTableBody) {
    const current = await findTable(shopId, id);
    if (name !== current.name) {
      const dup = await prisma.table.findUnique({ where: { shopId_name: { shopId, name } } });
      if (dup) throw new AppError(409, "มีโต๊ะชื่อนี้อยู่แล้ว", "DUPLICATE_TABLE");
    }
    return tableDto(await prisma.table.update({ where: { id }, data: { name, zone, seats } }));
  },

  /** ลบได้เฉพาะโต๊ะที่ปิดอยู่และไม่เคยมีออเดอร์ (ไม่งั้นประวัติยอดขายเสีย) */
  async remove(shopId: string, ids: string[]) {
    const tables = await prisma.table.findMany({ where: { shopId, id: { in: ids } } });
    if (tables.length !== ids.length) throw notFound("Table");
    const open = tables.find((t) => t.sessionId);
    if (open) throw new AppError(409, `${open.name} ยังเปิดอยู่ ปิดโต๊ะก่อนจึงลบได้`, "TABLE_OPEN");
    const used = await prisma.order.findFirst({ where: { tableId: { in: ids } }, select: { table: true } });
    if (used) {
      throw new AppError(409, `${used.table.name} มีประวัติออเดอร์แล้ว ลบไม่ได้`, "TABLE_IN_USE");
    }
    await prisma.table.deleteMany({ where: { shopId, id: { in: ids } } });
  },

  async reorder(shopId: string, ids: string[]) {
    const owned = await prisma.table.findMany({ where: { shopId, id: { in: ids } }, select: { id: true } });
    if (owned.length !== ids.length) throw new AppError(400, "รายการโต๊ะไม่ถูกต้อง");
    await prisma.$transaction(
      ids.map((id, index) => prisma.table.update({ where: { id }, data: { sortOrder: index } })),
    );
  },

  /** เปิดโต๊ะ = เริ่มรอบใหม่ ลูกค้าสแกน QR แล้วสั่งได้ (เปิดซ้ำคืนรอบเดิม) */
  async open(shopId: string, id: string) {
    const table = await findTable(shopId, id);
    if (table.sessionId) return tableDto(table);
    return tableDto(
      await prisma.table.update({
        where: { id },
        data: { sessionId: randomUUID(), sessionOpenedAt: new Date() },
      }),
    );
  },

  /** ปิดโต๊ะ = จบรอบ ต้องชำระครบก่อน (ออเดอร์ที่ยกเลิกไม่นับ) */
  async close(shopId: string, id: string) {
    const table = await findTable(shopId, id);
    if (!table.sessionId) return tableDto(table);
    const orders = await liveOrders(shopId, table.sessionId);
    if (orders.some((order) => order.paymentStatus === "UNPAID")) {
      throw new AppError(409, `${table.name} ยังมีออเดอร์ที่ไม่ได้ชำระ ไปคิดเงินก่อน`, "UNPAID_ORDERS");
    }
    return tableDto(
      await prisma.table.update({ where: { id }, data: { sessionId: null, sessionOpenedAt: null } }),
    );
  },
};
