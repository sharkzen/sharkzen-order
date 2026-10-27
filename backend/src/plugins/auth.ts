import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import fp from "fastify-plugin";
import { env } from "../config/env.js";
import { SESSION_COOKIE } from "../controllers/auth.controller.js";
import { AppError } from "../utils/errors.js";

/** cookie + JWT session และ rate limit (เปิดเฉพาะ route ที่ตั้ง config.rateLimit) */
export const authPlugin = fp(async (app) => {
  await app.register(cookie);
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: SESSION_COOKIE, signed: false },
  });
  await app.register(rateLimit, { global: false });

  app.decorate("authenticate", async (request) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new AppError(401, "กรุณาเข้าสู่ระบบ", "UNAUTHORIZED");
    }
  });
});
