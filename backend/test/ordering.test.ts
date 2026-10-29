import "./setup.js";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateOrderCode } from "@/lib/order-code.js";
import { prisma } from "@/lib/prisma.js";
import { createOrderBodySchema, MAX_DISHES, MAX_LINES } from "@/schemas/order.schema.js";
import { MAX_WAITING_PER_TABLE, orderService } from "@/services/order.service.js";
import { tableService } from "@/services/table.service.js";
import { customerOrder, makeShop, rejectsWith } from "./fixtures.js";

describe("รหัสออเดอร์", () => {
  it("รูปแบบ SZ-yyMMdd-XXXXXX และไม่ซ้ำกัน", () => {
    const codes = new Set(Array.from({ length: 2000 }, () => generateOrderCode()));
    assert.equal(codes.size, 2000);
    for (const code of codes) assert.match(code, /^SZ-\d{6}-[A-HJ-NP-Z2-9]{6}$/);
  });

  it("ใช้วันที่ตามเวลาไทย", () => {
    // 2026-10-29 18:00 UTC = 30 ต.ค. 01:00 ไทย
    assert.match(generateOrderCode(new Date("2026-10-29T18:00:00Z")), /^SZ-261030-/);
  });

  it("ออเดอร์จริงได้รหัสและค้นหาด้วยรหัส (ไม่สนตัวพิมพ์) เจอเฉพาะใบนั้น", async () => {
    const s = await makeShop("code");
    const { order } = await customerOrder(s);
    await customerOrder(s);
    const found = await orderService.list(s.shopId, { q: order.code.toLowerCase() });
    assert.deepEqual(
      found.map((o) => o.id),
      [order.id],
    );
  });
});

describe("กันสั่งซ้ำ", () => {
  it("กุญแจเดียวกันส่งซ้ำ (กดรัว/ลองใหม่) ได้ออเดอร์เดิม ไม่สร้างใหม่", async () => {
    const s = await makeShop("idem");
    const first = await customerOrder(s, undefined, "key-aaaaaaaa-1");
    const again = await customerOrder(s, undefined, "key-aaaaaaaa-1");
    assert.equal(first.duplicate, false);
    assert.equal(again.duplicate, true);
    assert.equal(again.order.id, first.order.id);
    assert.equal(await prisma.order.count({ where: { tableId: s.tableId } }), 1);
  });

  it("ส่งพร้อมกันหลายคำขอด้วยกุญแจเดียวกัน ได้ออเดอร์เดียว", async () => {
    const s = await makeShop("race");
    const results = await Promise.all(Array.from({ length: 5 }, () => customerOrder(s, undefined, "key-race-0001")));
    assert.equal(new Set(results.map((r) => r.order.id)).size, 1);
    assert.equal(await prisma.order.count({ where: { tableId: s.tableId } }), 1);
  });

  it("กุญแจต่างกัน = สั่งรอบใหม่ได้ตามปกติ (ลูกค้าสั่งหลายรอบ)", async () => {
    const s = await makeShop("rounds");
    await customerOrder(s, undefined, "key-round-0001");
    await customerOrder(s, undefined, "key-round-0002");
    assert.equal(await prisma.order.count({ where: { tableId: s.tableId } }), 2);
  });

  it("ไม่ส่งกุญแจ = ไม่กันซ้ำ (ใช้ได้เหมือนเดิม)", async () => {
    const s = await makeShop("nokey");
    await customerOrder(s);
    await customerOrder(s);
    assert.equal(await prisma.order.count({ where: { tableId: s.tableId } }), 2);
  });
});

describe("จำกัดขนาดออเดอร์", () => {
  const line = (quantity: number) => ({ menuItemId: "m", quantity, options: [], note: "" });

  it(`ไม่เกิน ${MAX_LINES} รายการและ ${MAX_DISHES} จานต่อครั้ง`, () => {
    assert.ok(createOrderBodySchema.safeParse({ items: Array.from({ length: MAX_LINES }, () => line(1)) }).success);
    assert.ok(!createOrderBodySchema.safeParse({ items: Array.from({ length: MAX_LINES + 1 }, () => line(1)) }).success);
    assert.ok(createOrderBodySchema.safeParse({ items: [line(50), line(50)] }).success);
    assert.ok(!createOrderBodySchema.safeParse({ items: [line(50), line(51)] }).success);
    assert.ok(!createOrderBodySchema.safeParse({ items: [line(100)] }).success); // เกิน 99 ต่อรายการ
    assert.ok(!createOrderBodySchema.safeParse({ items: [] }).success);
  });

  it(`ออเดอร์ที่ครัวยังไม่รับค้างได้ไม่เกิน ${MAX_WAITING_PER_TABLE} แต่พอครัวรับก็สั่งรอบใหม่ได้`, async () => {
    const s = await makeShop("waiting");
    const placed = [];
    for (let i = 0; i < MAX_WAITING_PER_TABLE; i++) placed.push((await customerOrder(s)).order);
    const error = await rejectsWith(customerOrder(s), 429);
    assert.equal(error.code, "TOO_MANY_WAITING");
    await orderService.updateStatus(s.shopId, placed[0].id, "PREPARING");
    await customerOrder(s); // ครัวรับแล้ว 1 ใบ → สั่งต่อได้
  });

  it("โต๊ะของร้านอื่นไม่โดนเพดานของโต๊ะนี้", async () => {
    const s = await makeShop("waiting-other");
    for (let i = 0; i < MAX_WAITING_PER_TABLE; i++) await customerOrder(s);
    const other = await makeShop("waiting-other-2");
    await customerOrder(other);
  });
});

describe("รอบการนั่ง (session)", () => {
  it("เปิดโต๊ะรอบใหม่ แล้วตั๋วรอบเก่าสั่งไม่ได้", async () => {
    const s = await makeShop("session");
    await customerOrder(s);
    await prisma.table.update({ where: { id: s.tableId }, data: { sessionId: null, sessionOpenedAt: null } });
    await tableService.open(s.shopId, s.tableId);
    await rejectsWith(customerOrder(s), 409);
  });

  it("โต๊ะที่ยังไม่เปิดสั่งไม่ได้", async () => {
    const s = await makeShop("closed");
    await prisma.table.update({ where: { id: s.tableId }, data: { sessionId: null, sessionOpenedAt: null } });
    await rejectsWith(customerOrder(s), 409);
  });
});
