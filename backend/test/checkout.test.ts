import "./setup.js";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prisma } from "@/lib/prisma.js";
import { cashierService } from "@/services/cashier.service.js";
import { orderService } from "@/services/order.service.js";
import { tableService } from "@/services/table.service.js";
import { customerOrder, makeShop, rejectsWith } from "./fixtures.js";

describe("คิดเงิน", () => {
  it("รวมทุกรอบของโต๊ะ หักส่วนลด บวกค่าบริการจากยอดหลังลด และคำนวณเงินทอน", async () => {
    const s = await makeShop("pay", { serviceChargePercent: 10 });
    await customerOrder(s, [{ menuItemId: s.noodle.id, quantity: 2 }]); // 120
    await customerOrder(s, [{ menuItemId: s.tea.id, quantity: 1 }]); // 40 → รวม 160
    const result = await cashierService.pay(s.shopId, s.tableId, { method: "CASH", discount: 20, received: 200 });
    // (160 - 20) = 140, ค่าบริการ 10% = 14, สุทธิ 154, ทอน 46
    assert.deepEqual(
      [result.bill.subtotal, result.bill.discount, result.bill.serviceCharge, result.bill.total, result.bill.change],
      [160, 20, 14, 154, 46],
    );
    assert.equal(result.orderIds.length, 2);
  });

  it("ส่วนลดเกินยอดรวมถูกจำกัดที่ยอดรวม และเงินไม่พอถูกปฏิเสธ", async () => {
    const s = await makeShop("cap");
    await customerOrder(s);
    const error = await rejectsWith(
      cashierService.pay(s.shopId, s.tableId, { method: "CASH", discount: 0, received: 10 }),
      400,
    );
    assert.equal(error.code, "INSUFFICIENT_CASH");
    const { bill } = await cashierService.pay(s.shopId, s.tableId, { method: "TRANSFER", discount: 9999 });
    assert.equal(bill.discount, 60);
    assert.equal(bill.total, 0);
  });

  it("จ่ายซ้ำไม่ได้ (ไม่มียอดค้าง) และผูกทุกออเดอร์เข้ากับบิลเดียวกัน", async () => {
    const s = await makeShop("twice");
    const first = (await customerOrder(s)).order;
    const second = (await customerOrder(s)).order;
    await cashierService.pay(s.shopId, s.tableId, { method: "TRANSFER", discount: 0 });
    const error = await rejectsWith(
      cashierService.pay(s.shopId, s.tableId, { method: "TRANSFER", discount: 0 }),
      409,
    );
    assert.equal(error.code, "NOTHING_TO_PAY");
    const [a, b] = await Promise.all([
      orderService.getById(s.shopId, first.id),
      orderService.getById(s.shopId, second.id),
    ]);
    assert.equal(a.paymentStatus, "PAID");
    assert.ok(a.billId && a.billId === b.billId);
  });

  it("ออเดอร์ที่ยกเลิกไม่ถูกเรียกเก็บ และสั่งเพิ่มหลังจ่ายเรียกเก็บเฉพาะรอบใหม่", async () => {
    const s = await makeShop("late");
    const keep = (await customerOrder(s)).order; // 60
    const gone = (await customerOrder(s, [{ menuItemId: s.tea.id, quantity: 3 }])).order;
    await orderService.cancel(s.shopId, gone.id, "ลูกค้ายกเลิก");
    const first = await cashierService.pay(s.shopId, s.tableId, { method: "TRANSFER", discount: 0 });
    assert.equal(first.bill.total, 60);
    await customerOrder(s, [{ menuItemId: s.tea.id, quantity: 1 }]); // 40
    const second = await cashierService.pay(s.shopId, s.tableId, { method: "TRANSFER", discount: 0 });
    assert.equal(second.bill.total, 40);
    assert.equal((await orderService.getById(s.shopId, keep.id)).paymentStatus, "PAID");
  });

  it("ปิดโต๊ะไม่ได้ถ้ายังมียอดค้าง และปิดได้หลังจ่าย", async () => {
    const s = await makeShop("close");
    await customerOrder(s);
    const error = await rejectsWith(tableService.close(s.shopId, s.tableId), 409);
    assert.equal(error.code, "UNPAID_ORDERS");
    await cashierService.pay(s.shopId, s.tableId, { method: "TRANSFER", discount: 0 });
    const closed = await tableService.close(s.shopId, s.tableId);
    assert.equal(closed.session, null);
  });

  it("ใบเสร็จย้อนหลังมีรหัสออเดอร์ทุกใบในบิลและไม่มีที่ยกเลิก ส่วนออเดอร์ที่ยังไม่จ่ายขอไม่ได้", async () => {
    const s = await makeShop("receipt");
    const one = (await customerOrder(s)).order;
    const two = (await customerOrder(s)).order;
    const three = (await customerOrder(s)).order;
    await orderService.cancel(s.shopId, three.id, "x");
    const error = await rejectsWith(cashierService.receipt(s.shopId, one.id), 409);
    assert.equal(error.code, "NOT_PAID");
    await cashierService.pay(s.shopId, s.tableId, { method: "CASH", discount: 0, received: 500 });
    const receipt = await cashierService.receipt(s.shopId, two.id);
    assert.deepEqual(receipt.rounds.map((round) => round.code).sort(), [one.code, two.code].sort());
    assert.equal(receipt.payment.total, 120);
  });

  describe("ยอดเก็บวันนี้", () => {
    it("หักเงินคืนเมื่อออเดอร์ที่จ่ายแล้วถูกครัวยกเลิกทั้งใบ", async () => {
      const s = await makeShop("refund-order");
      const order = (await customerOrder(s, [{ menuItemId: s.noodle.id, quantity: 2 }])).order; // 120
      await cashierService.pay(s.shopId, s.tableId, { method: "TRANSFER", discount: 0 });
      assert.equal(await cashierService.collectedToday(s.shopId), 120);
      await orderService.cancel(s.shopId, order.id, "วัตถุดิบหมด", true);
      assert.equal(await cashierService.collectedToday(s.shopId), 0);
    });

    it("หักเงินคืนเท่าราคาจานที่ครัวยกเลิกบางจาน", async () => {
      const s = await makeShop("refund-item");
      const order = (await customerOrder(s, [{ menuItemId: s.noodle.id, quantity: 3 }])).order; // 180
      await cashierService.pay(s.shopId, s.tableId, { method: "TRANSFER", discount: 0 });
      await orderService.cancelItem(s.shopId, order.id, order.items[0].id, 1, "หมด", true);
      assert.equal(await cashierService.collectedToday(s.shopId), 120);
      const refunds = await prisma.refund.findMany({ where: { orderId: order.id } });
      assert.equal(refunds.length, 1);
      assert.equal(Number(refunds[0].amount), 60);
    });

    it("ออเดอร์ที่ยังไม่จ่ายถูกยกเลิก ไม่ถือเป็นเงินคืน", async () => {
      const s = await makeShop("no-refund");
      const order = (await customerOrder(s)).order;
      await orderService.cancel(s.shopId, order.id, "x");
      assert.equal(await prisma.refund.count({ where: { orderId: order.id } }), 0);
      assert.equal(await cashierService.collectedToday(s.shopId), 0);
    });

    it("หน้าร้านยกเลิกออเดอร์ที่จ่ายแล้วไม่ได้ (ต้องให้ครัวยกเลิกเพื่อคืนเงิน)", async () => {
      const s = await makeShop("paid-lock");
      const order = (await customerOrder(s)).order;
      await cashierService.pay(s.shopId, s.tableId, { method: "TRANSFER", discount: 0 });
      await rejectsWith(orderService.cancel(s.shopId, order.id, "x"), 409);
    });
  });
});
