import "./setup.js";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";
import { buildApp } from "@/app.js";
import { SESSION_COOKIE } from "@/controllers/auth.controller.js";
import { hashPassword } from "@/lib/crypto.js";
import { prisma } from "@/lib/prisma.js";
import { makeShop, type TestShop } from "./fixtures.js";

type App = Awaited<ReturnType<typeof buildApp>>;

describe("พนักงาน: เข้าสู่ระบบและสิทธิ์", () => {
  let app: App;
  let a: TestShop;
  let b: TestShop;
  let cashier: { id: string; cookie: string };
  let chef: { id: string; cookie: string };

  const json = (res: { body: string }) => JSON.parse(res.body) as Record<string, any>;
  const call = (cookie: string | undefined, method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", url: string, payload?: object) =>
    app.inject({ method, url, headers: cookie ? { cookie } : {}, ...(method === "GET" || method === "DELETE" ? {} : { payload: payload ?? {} }) });
  const staffCookie = (id: string) => `${SESSION_COOKIE}=${app.jwt.sign({ sub: id, kind: "staff" })}`;

  async function makeStaff(shopId: string, permissions: string[], extra: { mustChangePassword?: boolean; suspended?: boolean } = {}) {
    const role = await prisma.role.create({ data: { shopId, name: `r-${randomUUID()}`, permissions } });
    const member = await prisma.staffMember.create({
      data: {
        shopId,
        roleId: role.id,
        name: "พนักงานทดสอบ",
        username: `u${randomUUID().slice(0, 8)}`,
        passwordHash: await hashPassword("Staff#12345"),
        mustChangePassword: extra.mustChangePassword ?? false,
        suspended: extra.suspended ?? false,
      },
    });
    return { member, cookie: staffCookie(member.id) };
  }

  before(async () => {
    app = await buildApp();
    a = await makeShop("stA");
    b = await makeShop("stB");
    const c = await makeStaff(a.shopId, ["cashier.view", "orders.view", "orders.payment", "tables.view", "dashboard.view", "menu.view"]);
    cashier = { id: c.member.id, cookie: c.cookie };
    const k = await makeStaff(a.shopId, ["kitchen.view", "kitchen.update_status"]);
    chef = { id: k.member.id, cookie: k.cookie };
  });

  after(() => app.close());

  it("เข้าสู่ระบบด้วยรหัสร้าน+ชื่อผู้ใช้+รหัสผ่าน และได้รายการสิทธิ์กลับมา", async () => {
    const shop = await prisma.shop.findUniqueOrThrow({ where: { id: a.shopId } });
    const member = await prisma.staffMember.findUniqueOrThrow({ where: { id: cashier.id } });
    const ok = await call(undefined, "POST", "/api/auth/staff-login", { shopCode: shop.code.toLowerCase(), username: member.username, password: "Staff#12345" });
    assert.equal(ok.statusCode, 200);
    assert.equal(json(ok).user.role, "STAFF");
    assert.ok(json(ok).user.permissions.includes("cashier.view"));

    const wrong = await call(undefined, "POST", "/api/auth/staff-login", { shopCode: shop.code, username: member.username, password: "ผิด" });
    assert.equal(wrong.statusCode, 401);
    // รหัสร้านของร้านอื่น + ชื่อผู้ใช้นี้ = เข้าไม่ได้ (ชื่อผู้ใช้ซ้ำข้ามร้านได้ แต่ไม่ข้ามร้านเอง)
    const otherShop = await prisma.shop.findUniqueOrThrow({ where: { id: b.shopId } });
    const cross = await call(undefined, "POST", "/api/auth/staff-login", { shopCode: otherShop.code, username: member.username, password: "Staff#12345" });
    assert.equal(cross.statusCode, 401);
  });

  it("พนักงานทำได้เฉพาะที่บทบาทอนุญาต (default-deny)", async () => {
    assert.equal((await call(cashier.cookie, "GET", "/api/cashier/bills")).statusCode, 200);
    assert.equal((await call(cashier.cookie, "GET", "/api/tables")).statusCode, 200);
    // ไม่มีสิทธิ์
    assert.equal((await call(cashier.cookie, "POST", "/api/menu/items", { name: "x", price: 1 })).statusCode, 403);
    assert.equal((await call(cashier.cookie, "GET", "/api/reports/sales")).statusCode, 403);
    assert.equal((await call(cashier.cookie, "GET", "/api/staff")).statusCode, 403);
    // เส้นของเจ้าของร้านล้วน: ไม่อยู่ในตารางสิทธิ์ = ปฏิเสธเสมอ
    assert.equal((await call(cashier.cookie, "GET", "/api/billing")).statusCode, 403);
    assert.equal((await call(cashier.cookie, "POST", "/api/billing/portal")).statusCode, 403);
    assert.equal((await call(cashier.cookie, "GET", "/api/shop/branches")).statusCode, 403);
    assert.equal((await call(cashier.cookie, "PUT", "/api/auth/plan", { plan: "growth", billing: "monthly" })).statusCode, 403);
    assert.equal((await call(cashier.cookie, "GET", "/api/admin/overview")).statusCode, 403);
    // พ่อครัวเห็นออเดอร์ได้แต่เก็บเงินไม่ได้
    assert.equal((await call(chef.cookie, "GET", "/api/orders")).statusCode, 200);
    assert.equal((await call(chef.cookie, "GET", "/api/cashier/bills")).statusCode, 403);
  });

  it("เห็นข้อมูลเฉพาะร้านของตัวเอง", async () => {
    await prisma.table.create({ data: { shopId: b.shopId, name: "โต๊ะร้านB" } });
    const tables = json(await call(cashier.cookie, "GET", "/api/tables")) as unknown as { name: string }[];
    assert.ok(tables.length > 0);
    assert.ok(!tables.some((t) => t.name === "โต๊ะร้านB"));
  });

  it("ต้องเปลี่ยนรหัสผ่านตั้งต้นก่อนใช้งานอย่างอื่น", async () => {
    const s = await makeStaff(a.shopId, ["tables.view"], { mustChangePassword: true });
    assert.equal((await call(s.cookie, "GET", "/api/auth/me")).statusCode, 200);
    const blocked = await call(s.cookie, "GET", "/api/tables");
    assert.equal(json(blocked).code, "PASSWORD_CHANGE_REQUIRED");

    assert.equal((await call(s.cookie, "POST", "/api/auth/staff-change-password", { currentPassword: "ผิด", newPassword: "NewPass#123" })).statusCode, 400);
    assert.equal((await call(s.cookie, "POST", "/api/auth/staff-change-password", { currentPassword: "Staff#12345", newPassword: "Staff#12345" })).statusCode, 400);
    assert.equal((await call(s.cookie, "POST", "/api/auth/staff-change-password", { currentPassword: "Staff#12345", newPassword: "NewPass#123" })).statusCode, 200);
    assert.equal((await call(s.cookie, "GET", "/api/tables")).statusCode, 200);
  });

  it("ระงับพนักงาน: ใช้ session เดิมและล็อกอินไม่ได้ทันที", async () => {
    const s = await makeStaff(a.shopId, ["tables.view"]);
    assert.equal((await call(s.cookie, "GET", "/api/tables")).statusCode, 200);
    await prisma.staffMember.update({ where: { id: s.member.id }, data: { suspended: true } });
    const res = await call(s.cookie, "GET", "/api/tables");
    assert.equal(res.statusCode, 403);
    assert.equal(json(res).code, "STAFF_SUSPENDED");
    const shop = await prisma.shop.findUniqueOrThrow({ where: { id: a.shopId } });
    const login = await call(undefined, "POST", "/api/auth/staff-login", { shopCode: shop.code, username: s.member.username, password: "Staff#12345" });
    assert.equal(json(login).code, "STAFF_SUSPENDED");
  });

  it("เจ้าของถูกแบน หรือร้านถูกระงับ: พนักงานเข้าไม่ได้ทั้ง session เดิมและล็อกอินใหม่", async () => {
    const owner = await makeShop("stBan");
    const s = await makeStaff(owner.shopId, ["tables.view"]);
    const shop = await prisma.shop.findUniqueOrThrow({ where: { id: owner.shopId } });
    const login = () => call(undefined, "POST", "/api/auth/staff-login", { shopCode: shop.code, username: s.member.username, password: "Staff#12345" });
    assert.equal((await call(s.cookie, "GET", "/api/tables")).statusCode, 200);

    await prisma.user.update({ where: { id: owner.user.id }, data: { bannedAt: new Date(), banReason: "ทดสอบ" } });
    const banned = await call(s.cookie, "GET", "/api/tables");
    assert.equal(json(banned).code, "ACCOUNT_BANNED");
    assert.equal(json(banned).reason, "ทดสอบ");
    assert.equal(json(await login()).code, "ACCOUNT_BANNED");
    await prisma.user.update({ where: { id: owner.user.id }, data: { bannedAt: null, banReason: "" } });
    assert.equal((await login()).statusCode, 200);

    await prisma.shop.update({ where: { id: owner.shopId }, data: { suspendedAt: new Date(), suspendReason: "x" } });
    assert.equal(json(await call(s.cookie, "GET", "/api/tables")).code, "SHOP_SUSPENDED");
    assert.equal(json(await login()).code, "SHOP_SUSPENDED");
    await prisma.shop.update({ where: { id: owner.shopId }, data: { suspendedAt: null } });
    assert.equal((await call(s.cookie, "GET", "/api/tables")).statusCode, 200);
  });

  it("พนักงานที่ถูกลบแล้วใช้ session เดิมไม่ได้", async () => {
    const s = await makeStaff(a.shopId, ["tables.view"]);
    await prisma.staffMember.delete({ where: { id: s.member.id } });
    assert.equal((await call(s.cookie, "GET", "/api/tables")).statusCode, 401);
  });
  it("ตรวจชื่อผู้ใช้: ซ้ำในร้านเดียวกันใช้ไม่ได้และเสนอชื่อใหม่ ร้านอื่นใช้ชื่อเดียวกันได้", async () => {
    const ownerCookie = `${SESSION_COOKIE}=${app.jwt.sign({ sub: a.user.id })}`;
    const check = async (username: string, cookie = ownerCookie) =>
      json(await call(cookie, "GET", `/api/staff/username-available?username=${encodeURIComponent(username)}`));

    const free = await check("napus");
    assert.equal(free.available, true);

    // สร้างพนักงานผ่าน API ของเจ้าของ: ไม่ต้องเปลี่ยนรหัสผ่านครั้งแรก
    const roles = json(await call(ownerCookie, "GET", "/api/staff")).roles as { id: string; locked: boolean }[];
    const role = roles.find((r) => !r.locked)!;
    const created = await call(ownerCookie, "POST", "/api/staff/members", { name: "นภัส", username: "napus", roleId: role.id, password: "Napus#1234" });
    assert.equal(created.statusCode, 201);
    assert.equal(json(created).mustChangePassword, false);

    const taken = await check("napus");
    assert.equal(taken.available, false);
    assert.equal(taken.reason, "taken");
    assert.ok(taken.suggestions.length > 0);
    for (const name of taken.suggestions as string[]) {
      assert.match(name, /^napus\d{3}$/);
      assert.equal((await check(name)).available, true, `${name} ต้องว่างจริง`);
    }
    // ตัวพิมพ์ใหญ่/ช่องว่างถือว่าชื่อเดียวกัน, รูปแบบผิดไม่ผ่าน
    assert.equal((await check(" NAPUS ")).available, false);
    assert.equal((await check("ab")).reason, "invalid");
    // แก้ไขพนักงานคนเดิม: ชื่อของตัวเองไม่นับว่าซ้ำ
    const id = json(created).id;
    const self = json(await call(ownerCookie, "GET", `/api/staff/username-available?username=napus&exceptId=${id}`));
    assert.equal(self.available, true);
    // ร้านอื่นใช้ชื่อ napus ได้
    const otherOwner = `${SESSION_COOKIE}=${app.jwt.sign({ sub: b.user.id })}`;
    assert.equal((await check("napus", otherOwner)).available, true);
    // พนักงานที่ไม่มีสิทธิ์สร้าง/จัดการ เรียกไม่ได้
    assert.equal((await call(cashier.cookie, "GET", "/api/staff/username-available?username=xyz1234")).statusCode, 403);
  });

  it("รีเซ็ตรหัสผ่านพนักงานแล้วใช้ได้เลย ไม่บังคับเปลี่ยนรหัส", async () => {
    const ownerCookie = `${SESSION_COOKIE}=${app.jwt.sign({ sub: a.user.id })}`;
    const s = await makeStaff(a.shopId, ["tables.view"]);
    const res = await call(ownerCookie, "POST", `/api/staff/members/${s.member.id}/reset-password`, { password: "Reset#12345" });
    assert.equal(res.statusCode, 200);
    assert.equal((await prisma.staffMember.findUniqueOrThrow({ where: { id: s.member.id } })).mustChangePassword, false);
    assert.equal((await call(s.cookie, "GET", "/api/tables")).statusCode, 200);
  });
});
