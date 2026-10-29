import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma.js";
import { encodeSessionToken, encodeTableToken } from "@/lib/table-token.js";
import { orderService } from "@/services/order.service.js";

/** ร้านพร้อมใช้: เจ้าของ 1 คน โต๊ะ 1 โต๊ะ (เปิดรอบแล้ว) เมนู 2 รายการ */
export async function makeShop(label: string, opts: { serviceChargePercent?: number } = {}) {
  const user = await prisma.user.create({
    data: {
      email: `${label}-${randomUUID()}@test.local`,
      firstName: label,
      lastName: "Owner",
      passwordHash: "x",
      acceptedTermsAt: new Date(),
    },
  });
  const shop = await prisma.shop.create({
    data: { ownerId: user.id, name: `ร้าน ${label}`, serviceChargePercent: opts.serviceChargePercent ?? 0 },
  });
  const sessionId = randomUUID();
  const table = await prisma.table.create({
    data: { shopId: shop.id, name: "โต๊ะ 1", sessionId, sessionOpenedAt: new Date() },
  });
  const noodle = await prisma.menuItem.create({ data: { shopId: shop.id, name: "ก๋วยเตี๋ยว", price: 60 } });
  const tea = await prisma.menuItem.create({ data: { shopId: shop.id, name: "ชาเย็น", price: 40 } });
  return {
    user,
    shop,
    shopId: shop.id,
    table,
    tableId: table.id,
    sessionId,
    noodle,
    tea,
    token: encodeTableToken(shop.id, table.id),
    ticket: encodeSessionToken(sessionId),
  };
}

export type TestShop = Awaited<ReturnType<typeof makeShop>>;

/** ลูกค้าสั่งผ่าน QR ของโต๊ะ (เส้นทางเดียวกับของจริง) */
export async function customerOrder(
  s: TestShop,
  items: { menuItemId: string; quantity: number }[] = [{ menuItemId: s.noodle.id, quantity: 1 }],
  idempotencyKey?: string,
) {
  return orderService.create(
    s.token,
    { notes: [], items: items.map((item) => ({ ...item, options: [], note: "" })) },
    s.ticket,
    idempotencyKey,
  );
}

/** ตรวจว่า promise ถูกปฏิเสธด้วย AppError ที่ status ตามคาด */
export async function rejectsWith(promise: Promise<unknown>, statusCode: number) {
  try {
    await promise;
  } catch (error) {
    const actual = (error as { statusCode?: number }).statusCode;
    if (actual === statusCode) return error as { statusCode: number; code?: string };
    throw new Error(`คาดว่า status ${statusCode} แต่ได้ ${actual ?? String(error)}`);
  }
  throw new Error(`คาดว่าต้องถูกปฏิเสธด้วย ${statusCode} แต่สำเร็จ`);
}
