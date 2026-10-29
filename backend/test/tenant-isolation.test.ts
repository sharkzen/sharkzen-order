import "./setup.js";
import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { cashierService } from "@/services/cashier.service.js";
import { menuService } from "@/services/menu.service.js";
import { orderService } from "@/services/order.service.js";
import { shopService } from "@/services/shop.service.js";
import { tableService } from "@/services/table.service.js";
import { customerOrder, makeShop, rejectsWith, type TestShop } from "./fixtures.js";

/**
 * ร้าน B ถือสิทธิ์ของตัวเองครบ แต่รู้ id ของข้อมูลร้าน A (เดาหรือได้มาจากที่ไหนก็ตาม)
 * ทุกเส้นทางต้องปฏิเสธ ไม่ให้อ่านหรือแก้ข้ามร้าน
 */
describe("แยกข้อมูลระหว่างร้าน (multi-tenant)", () => {
  let a: TestShop;
  let b: TestShop;
  let orderA: { id: string; code: string; items: { id: string }[] };

  before(async () => {
    a = await makeShop("A");
    b = await makeShop("B");
    orderA = (await customerOrder(a)).order;
  });

  it("อ่านออเดอร์ข้ามร้านไม่ได้", async () => {
    await rejectsWith(orderService.getById(b.shopId, orderA.id), 404);
  });

  it("รายการออเดอร์ของร้าน B ไม่มีออเดอร์ของร้าน A แม้ค้นด้วยรหัสตรงๆ", async () => {
    await customerOrder(b);
    const all = await orderService.list(b.shopId, { active: "true" });
    assert.ok(all.length > 0);
    assert.ok(all.every((order) => order.shopId === b.shopId));
    const searched = await orderService.list(b.shopId, { q: orderA.code });
    assert.deepEqual(searched, []);
    const kitchen = await orderService.list(b.shopId, { kitchen: "true" });
    assert.ok(kitchen.every((order) => order.shopId === b.shopId));
  });

  it("แก้สถานะ ยกเลิก ปรับจำนวน ข้ามร้านไม่ได้", async () => {
    const itemId = orderA.items[0].id;
    await rejectsWith(orderService.updateStatus(b.shopId, orderA.id, "PREPARING"), 404);
    await rejectsWith(orderService.cancel(b.shopId, orderA.id, "x"), 404);
    await rejectsWith(orderService.cancelItem(b.shopId, orderA.id, itemId, 1, "x"), 404);
    await rejectsWith(orderService.setItemQuantity(b.shopId, orderA.id, itemId, 2), 404);
    await rejectsWith(orderService.ackCancel(b.shopId, orderA.id), 404);
    const untouched = await orderService.getById(a.shopId, orderA.id);
    assert.equal(untouched.status, "NEW");
  });

  it("เพิ่มเมนูให้โต๊ะของร้านอื่นไม่ได้", async () => {
    await rejectsWith(
      orderService.addByStaff(b.shopId, a.tableId, [{ menuItemId: b.noodle.id, quantity: 1, options: [], note: "" }]),
      404,
    );
  });

  it("คิดเงิน พิมพ์ใบเสร็จ ดูบิล ข้ามร้านไม่ได้", async () => {
    await rejectsWith(cashierService.pay(b.shopId, a.tableId, { method: "CASH", discount: 0 }), 404);
    await rejectsWith(cashierService.receipt(b.shopId, orderA.id), 404);
    const { bills } = await cashierService.bills(b.shopId);
    assert.ok(bills.every((bill) => bill.tableId === b.tableId));
  });

  it("จัดการโต๊ะข้ามร้านไม่ได้", async () => {
    await rejectsWith(tableService.update(b.shopId, a.tableId, { name: "แฮ็ก", zone: "x", seats: 2 }), 404);
    await rejectsWith(tableService.open(b.shopId, a.tableId), 404);
    await rejectsWith(tableService.close(b.shopId, a.tableId), 404);
    await rejectsWith(tableService.remove(b.shopId, [a.tableId]), 404);
    await rejectsWith(tableService.reorder(b.shopId, [a.tableId]), 400);
  });

  it("จัดการเมนูข้ามร้านไม่ได้", async () => {
    const patch = {
      name: "แฮ็ก",
      description: "",
      price: 1,
      image: "",
      available: true,
      featured: false,
      categoryId: null,
      optionGroups: [],
    };
    await rejectsWith(menuService.updateItem(b.shopId, a.noodle.id, patch), 404);
    await rejectsWith(menuService.deleteItem(b.shopId, a.noodle.id), 404);
    await rejectsWith(menuService.reorderItems(b.shopId, null, [a.noodle.id]), 400);
    const still = await menuService.list(a.shopId);
    assert.ok(still.items.some((item) => item.id === a.noodle.id));
  });

  it("สั่งผ่าน QR ของร้าน B ด้วยเมนูร้าน A ไม่ได้", async () => {
    const error = await rejectsWith(customerOrder(b, [{ menuItemId: a.noodle.id, quantity: 1 }]), 400);
    assert.equal(error.code, "MENU_NOT_FOUND");
  });

  it("ตั๋วรอบของร้าน A ใช้กับโต๊ะของร้าน B ไม่ได้", async () => {
    await rejectsWith(
      orderService.create(
        b.token,
        { notes: [], items: [{ menuItemId: b.noodle.id, quantity: 1, options: [], note: "" }] },
        a.ticket,
      ),
      409,
    );
  });

  it("สลับไปสาขาของคนอื่นไม่ได้ และ idForUser ได้เฉพาะร้านของตัวเอง", async () => {
    await rejectsWith(shopService.switchBranch(b.user.id, a.shopId), 404);
    assert.equal(await shopService.idForUser(b.user.id), b.shopId);
    assert.equal(await shopService.idForUser(a.user.id), a.shopId);
  });
});
