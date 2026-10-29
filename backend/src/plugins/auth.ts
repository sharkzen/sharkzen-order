import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import fp from "fastify-plugin";
import { env } from "@/config/env.js";
import { SESSION_COOKIE } from "@/controllers/auth.controller.js";
import { loadActiveStaff, userGate } from "@/lib/access.js";
import { clientIp, ipAllowed } from "@/lib/ip-allowlist.js";
import { staffMayCall } from "@/lib/route-permissions.js";
import { AppError, bannedError } from "@/utils/errors.js";

/** เมื่อพนักงานยังไม่เปลี่ยนรหัสผ่านตั้งต้น ใช้ได้แค่เส้นเหล่านี้ */
const PASSWORD_CHANGE_ALLOWED = new Set(["GET /api/auth/me", "POST /api/auth/logout", "POST /api/auth/staff-change-password"]);

/** cookie + JWT session และ rate limit (เปิดเฉพาะ route ที่ตั้ง config.rateLimit) */
export const authPlugin = fp(async (app) => {
  await app.register(cookie);
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: SESSION_COOKIE, signed: false },
  });
  await app.register(rateLimit, { global: false });
  app.decorateRequest("staff", null);

  app.decorate("authenticate", async (request) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new AppError(401, "กรุณาเข้าสู่ระบบ", "UNAUTHORIZED");
    }

    if (request.user.kind === "staff") {
      const staff = await loadActiveStaff(request.user.sub);
      const route = `${request.method} ${request.routeOptions.url ?? request.url}`;
      if (staff.mustChangePassword && !PASSWORD_CHANGE_ALLOWED.has(route)) {
        throw new AppError(403, "กรุณาเปลี่ยนรหัสผ่านก่อนใช้งาน", "PASSWORD_CHANGE_REQUIRED");
      }
      if (!staffMayCall(request.method, request.routeOptions.url ?? "", staff.permissions)) {
        throw new AppError(403, "บัญชีของคุณไม่มีสิทธิ์ทำรายการนี้", "FORBIDDEN");
      }
      request.staff = staff;
      return;
    }

    const gate = await userGate(request.user.sub);
    if (!gate) throw new AppError(401, "กรุณาเข้าสู่ระบบ", "UNAUTHORIZED");
    // บัญชีที่ถูกแบนใช้งานไม่ได้ทุกเส้น แม้ session เดิมยังไม่หมดอายุ
    if (gate.bannedAt) throw bannedError(gate.banReason);
  });

  app.decorate("authenticateAdmin", async (request) => {
    // จำกัด IP ก่อนทุกอย่าง (ตั้ง ADMIN_IP_ALLOWLIST) คนนอกรายการไม่ได้แม้แต่รู้ว่ามีหน้านี้
    if (!ipAllowed(clientIp(request), env.ADMIN_IP_ALLOWLIST)) {
      throw new AppError(404, "Not found", "NOT_FOUND");
    }
    await app.authenticate(request);
    const gate = request.user.kind === "staff" ? null : await userGate(request.user.sub);
    if (gate?.role !== "ADMIN") throw new AppError(403, "ต้องเป็นผู้ดูแลระบบเท่านั้น", "FORBIDDEN");
    // ผู้ดูแลระบบต้องเปิด 2FA ก่อนใช้งานส่วนนี้ (ตั้งค่าที่ /auth/totp/*)
    if (env.ADMIN_REQUIRE_2FA && !gate.totpEnabledAt) {
      throw new AppError(403, "ต้องเปิดใช้ 2FA ก่อนใช้งานพื้นที่ผู้ดูแลระบบ", "TOTP_SETUP_REQUIRED");
    }
  });
});
