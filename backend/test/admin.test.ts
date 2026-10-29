import "./setup.js";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";
import { buildApp } from "@/app.js";
import { SESSION_COOKIE } from "@/controllers/auth.controller.js";
import { env } from "@/config/env.js";
import { hashPassword } from "@/lib/crypto.js";
import { PLANS } from "@/lib/plans.js";
import { prisma } from "@/lib/prisma.js";
import { generateTotpSecret, totpAt } from "@/lib/totp.js";
import { authService } from "@/services/auth.service.js";
import { makeShop, rejectsWith, type TestShop } from "./fixtures.js";

type App = Awaited<ReturnType<typeof buildApp>>;

describe("ผู้ดูแลระบบ: แบน ระงับ แพ็กเกจ สิทธิ์", () => {
  let app: App;
  let admin: { id: string; cookie: string };
  let owner: TestShop;
  let ownerCookie: string;

  const cookieFor = (sub: string, kind?: "staff") => `${SESSION_COOKIE}=${app.jwt.sign({ sub, kind })}`;
  const call = (cookie: string | undefined, method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", url: string, payload?: object) =>
    app.inject({ method, url, headers: cookie ? { cookie } : {}, ...(method === "GET" || method === "DELETE" ? {} : { payload: payload ?? {} }) });
  const json = (res: { body: string }) => JSON.parse(res.body) as Record<string, any>;

  before(async () => {
    app = await buildApp();
    const user = await prisma.user.create({
      data: {
        email: `admin-${randomUUID()}@test.local`,
        firstName: "Admin",
        lastName: "T",
        passwordHash: await hashPassword("Admin#12345"),
        role: "ADMIN",
        emailVerifiedAt: new Date(),
        acceptedTermsAt: new Date(),
      },
    });
    admin = { id: user.id, cookie: cookieFor(user.id) };
    owner = await makeShop("adm-owner");
    ownerCookie = cookieFor(owner.user.id);
  });

  after(() => app.close());

  it("ต้องล็อกอินเป็นผู้ดูแลระบบเท่านั้น", async () => {
    assert.equal((await call(undefined, "GET", "/api/admin/overview")).statusCode, 401);
    const asOwner = await call(ownerCookie, "GET", "/api/admin/overview");
    assert.equal(asOwner.statusCode, 403);
    assert.equal((await call(admin.cookie, "GET", "/api/admin/overview")).statusCode, 200);
  });

  it("แบน: session เดิม ล็อกอิน และลูกค้าหน้าโต๊ะใช้ไม่ได้ ปลดแล้วกลับมาใช้ได้ทันที", async () => {
    assert.equal((await call(ownerCookie, "GET", "/api/shop")).statusCode, 200);
    assert.equal((await call(undefined, "GET", `/api/public/t/${owner.token}`)).statusCode, 200);

    const ban = await call(admin.cookie, "POST", `/api/admin/users/${owner.user.id}/ban`, { reason: "ค้างชำระ" });
    assert.equal(ban.statusCode, 200);

    const blocked = await call(ownerCookie, "GET", "/api/shop");
    assert.equal(blocked.statusCode, 403);
    assert.equal(json(blocked).code, "ACCOUNT_BANNED");
    assert.equal(json(blocked).reason, "ค้างชำระ");
    assert.equal((await call(undefined, "GET", `/api/public/t/${owner.token}`)).statusCode, 403);

    // ล็อกอินใหม่ด้วยรหัสผ่านที่ถูกก็เข้าไม่ได้
    await prisma.user.update({ where: { id: owner.user.id }, data: { passwordHash: await hashPassword("Owner#12345"), emailVerifiedAt: new Date() } });
    const login = await call(undefined, "POST", "/api/auth/login", { email: owner.user.email, password: "Owner#12345" });
    assert.equal(login.statusCode, 403);
    assert.equal(json(login).code, "ACCOUNT_BANNED");

    assert.equal((await call(admin.cookie, "POST", `/api/admin/users/${owner.user.id}/unban`)).statusCode, 200);
    assert.equal((await call(ownerCookie, "GET", "/api/shop")).statusCode, 200);
    assert.equal((await call(undefined, "GET", `/api/public/t/${owner.token}`)).statusCode, 200);
    assert.equal((await call(undefined, "POST", "/api/auth/login", { email: owner.user.email, password: "Owner#12345" })).statusCode, 200);
  });

  it("แบนผู้ดูแลระบบด้วยกันไม่ได้", async () => {
    assert.equal((await call(admin.cookie, "POST", `/api/admin/users/${admin.id}/ban`)).statusCode, 400);
  });

  it("ระงับสาขา: เจ้าของและลูกค้าใช้ไม่ได้ ปลดแล้วกลับมาใช้ได้", async () => {
    const r = await call(admin.cookie, "POST", `/api/admin/shops/${owner.shopId}/suspend`, { reason: "ตรวจสอบ" });
    assert.equal(r.statusCode, 200);
    const blocked = await call(ownerCookie, "GET", "/api/shop");
    assert.equal(json(blocked).code, "SHOP_SUSPENDED");
    assert.equal((await call(undefined, "GET", `/api/public/t/${owner.token}`)).statusCode, 403);
    await call(admin.cookie, "POST", `/api/admin/shops/${owner.shopId}/unsuspend`);
    assert.equal((await call(ownerCookie, "GET", "/api/shop")).statusCode, 200);
  });

  it("แก้แพ็กเกจและวันของผู้ใช้: ตั้งสถานะ เพิ่มวัน และบันทึกประวัติ", async () => {
    const set = await call(admin.cookie, "PATCH", `/api/admin/users/${owner.user.id}/subscription`, { plan: "starter", billing: "monthly", status: "TRIALING" });
    assert.equal(set.statusCode, 200);
    const before = new Date(json(set).trialEndsAt).getTime();
    const more = await call(admin.cookie, "PATCH", `/api/admin/users/${owner.user.id}/subscription`, { extendDays: 10 });
    assert.equal(Math.round((new Date(json(more).trialEndsAt).getTime() - before) / 86_400_000), 10);

    const active = await call(admin.cookie, "PATCH", `/api/admin/users/${owner.user.id}/subscription`, { status: "ACTIVE", plan: "growth" });
    assert.equal(json(active).status, "ACTIVE");
    assert.ok(json(active).currentPeriodEnd, "ACTIVE ที่ไม่ระบุวันต้องได้ 1 รอบบิล");

    assert.equal(json(await call(admin.cookie, "PATCH", `/api/admin/users/${owner.user.id}/subscription`, { plan: "ไม่มีแพ็กเกจนี้" })).code, "PLAN_UNAVAILABLE");

    const logs = json(await call(admin.cookie, "GET", "/api/admin/logs"));
    assert.ok(logs.items.some((row: { action: string }) => row.action === "subscription.update"));
  });

  it("แพ็กเกจ: สร้าง/ซ้ำ/แก้ราคา/ปิดขาย/ลบ และเห็นผลที่ API สาธารณะทันที", async () => {
    const body = { name: "ทดสอบ", description: "", monthly: 100, yearly: 1000, tablesLimit: 5, staffLimit: null, branchesLimit: 2, active: true, sortOrder: 9, cta: "เลือก", perks: ["ก", "ข"], featured: false };
    assert.equal((await call(admin.cookie, "POST", "/api/admin/plans", { id: "t-plan", ...body })).statusCode, 200);
    assert.equal(json(await call(admin.cookie, "POST", "/api/admin/plans", { id: "t-plan", ...body })).code, "DUPLICATE_PLAN");
    assert.equal((await call(admin.cookie, "POST", "/api/admin/plans", { id: "Bad Id", ...body })).statusCode, 400);

    assert.equal((await call(admin.cookie, "PUT", "/api/admin/plans/t-plan", { ...body, monthly: 150 })).statusCode, 200);
    assert.equal(PLANS["t-plan"]?.monthly, 150);
    const pub = json(await call(undefined, "GET", "/api/public/plans"));
    assert.equal(pub.plans.find((p: { id: string }) => p.id === "t-plan").monthly, 150);

    await call(admin.cookie, "PUT", "/api/admin/plans/t-plan", { ...body, active: false });
    const after = json(await call(undefined, "GET", "/api/public/plans"));
    assert.ok(!after.plans.some((p: { id: string }) => p.id === "t-plan"), "แพ็กเกจที่ปิดขายต้องไม่อยู่ในรายการสาธารณะ");
    await rejectsWith(authService.selectPlan(owner.user.id, "t-plan", "monthly"), 400);

    // มีผู้ใช้อยู่ ลบไม่ได้
    await call(admin.cookie, "PATCH", `/api/admin/users/${owner.user.id}/subscription`, { plan: "t-plan" });
    assert.equal(json(await call(admin.cookie, "DELETE", "/api/admin/plans/t-plan")).code, "PLAN_IN_USE");
    await call(admin.cookie, "PATCH", `/api/admin/users/${owner.user.id}/subscription`, { plan: "growth" });
    assert.equal((await call(admin.cookie, "DELETE", "/api/admin/plans/t-plan")).statusCode, 200);
    assert.equal(PLANS["t-plan"], undefined);
  });

  it("ต้องเหลือแพ็กเกจที่เปิดขายอย่างน้อย 1 แพ็กเกจ", async () => {
    const plans = json(await call(admin.cookie, "GET", "/api/admin/plans")) as unknown as { id: string; active: boolean; name: string }[];
    const active = plans.filter((p) => p.active);
    const full = (p: Record<string, unknown>) => ({ ...p, active: false });
    for (const p of active.slice(0, -1)) await call(admin.cookie, "PUT", `/api/admin/plans/${p.id}`, full(p));
    const last = active.at(-1)!;
    const res = await call(admin.cookie, "PUT", `/api/admin/plans/${last.id}`, full(last as unknown as Record<string, unknown>));
    assert.equal(json(res).code, "LAST_PLAN");
    for (const p of active.slice(0, -1)) await call(admin.cookie, "PUT", `/api/admin/plans/${p.id}`, { ...p, active: true });
  });

  it("ตั้งค่าระบบ: จำนวนวันทดลอง/ช่องทางติดต่อ มีผลที่ API สาธารณะ และตรวจค่าที่ผิด", async () => {
    const ok = await call(admin.cookie, "PUT", "/api/admin/settings", { trialDays: 21, yearlyFreeMonths: 3, supportEmail: "a@b.co", supportPhone: "", supportLine: "" });
    assert.equal(ok.statusCode, 200);
    const pub = json(await call(undefined, "GET", "/api/public/plans"));
    assert.equal(pub.trialDays, 21);
    assert.equal(pub.yearlyFreeMonths, 3);
    assert.equal(json(await call(undefined, "GET", "/api/public/support")).email, "a@b.co");
    assert.equal((await call(admin.cookie, "PUT", "/api/admin/settings", { trialDays: -1, yearlyFreeMonths: 3, supportEmail: "", supportPhone: "", supportLine: "" })).statusCode, 400);
    await call(admin.cookie, "PUT", "/api/admin/settings", { trialDays: 14, yearlyFreeMonths: 2, supportEmail: "support@sharkzen.app", supportPhone: "", supportLine: "" });
  });

  it("2FA: ผู้ดูแลที่เปิดไว้ต้องส่งรหัส และระบบบังคับเปิดก่อนใช้งานเมื่อเปิดโหมดบังคับ", async () => {
    const secret = generateTotpSecret();
    const email = `admin2fa-${randomUUID()}@test.local`;
    await prisma.user.create({
      data: { email, firstName: "A", lastName: "2", passwordHash: await hashPassword("Admin#12345"), role: "ADMIN", emailVerifiedAt: new Date(), acceptedTermsAt: new Date(), totpSecret: secret, totpEnabledAt: new Date() },
    });
    const login = (code?: string) => call(undefined, "POST", "/api/auth/login", { email, password: "Admin#12345", ...(code ? { code } : {}) });

    assert.equal(json(await login()).code, "TOTP_REQUIRED");
    assert.equal(json(await login("000000")).code, "TOTP_INVALID");
    assert.equal((await login(totpAt(secret, Date.now()))).statusCode, 200);

    // โหมดบังคับ: แอดมินที่ยังไม่ตั้ง 2FA เข้าพื้นที่แอดมินไม่ได้ แต่ตั้งค่า 2FA ได้
    env.ADMIN_REQUIRE_2FA = true;
    try {
      assert.equal(json(await call(admin.cookie, "GET", "/api/admin/overview")).code, "TOTP_SETUP_REQUIRED");
      const setup = json(await call(admin.cookie, "POST", "/api/auth/totp/setup"));
      assert.match(setup.otpauthUrl, /^otpauth:\/\/totp\//);
      assert.equal(json(await call(admin.cookie, "POST", "/api/auth/totp/enable", { code: "000000" })).code, "TOTP_INVALID");
      assert.equal((await call(admin.cookie, "POST", "/api/auth/totp/enable", { code: totpAt(setup.secret, Date.now()) })).statusCode, 200);
      assert.equal((await call(admin.cookie, "GET", "/api/admin/overview")).statusCode, 200);
    } finally {
      env.ADMIN_REQUIRE_2FA = false;
    }
    // เจ้าของร้านตั้ง 2FA ของผู้ดูแลระบบไม่ได้
    assert.equal((await call(ownerCookie, "POST", "/api/auth/totp/setup")).statusCode, 403);
  });
});
