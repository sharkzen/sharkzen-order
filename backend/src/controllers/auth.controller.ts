import type { User } from "@prisma/client";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "@/config/env.js";
import {
  emailOnlyBodySchema,
  loginBodySchema,
  registerBodySchema,
  resetPasswordBodySchema,
  selectPlanBodySchema,
  staffChangePasswordBodySchema,
  staffLoginBodySchema,
  totpCodeBodySchema,
  verifyEmailBodySchema,
} from "@/schemas/auth.schema.js";
import type { StaffContext } from "@/lib/access.js";
import { authService, toSessionStaff, toSessionUser } from "@/services/auth.service.js";

export const SESSION_COOKIE = "sz_session";
const DAY = 24 * 60 * 60;

async function startSession(reply: FastifyReply, user: User | StaffContext, remember = false, staff = false) {
  const maxAge = (remember ? 30 : 7) * DAY;
  const token = await reply.jwtSign(staff ? { sub: user.id, kind: "staff" as const } : { sub: user.id }, { expiresIn: maxAge });
  reply.setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
  return { user: staff ? toSessionStaff(user as StaffContext) : toSessionUser(user as User) };
}

export const authController = {
  async register(request: FastifyRequest, reply: FastifyReply) {
    const result = await authService.register(registerBodySchema.parse(request.body));
    return reply.code(201).send(result);
  },

  async verifyEmail(request: FastifyRequest, reply: FastifyReply) {
    const { email, code } = verifyEmailBodySchema.parse(request.body);
    const user = await authService.verifyEmail(email, code);
    return startSession(reply, user);
  },

  async resendOtp(request: FastifyRequest) {
    await authService.resendOtp(emailOnlyBodySchema.parse(request.body).email);
    return { sent: true };
  },

  async login(request: FastifyRequest, reply: FastifyReply) {
    const body = loginBodySchema.parse(request.body);
    const user = await authService.login(body);
    return startSession(reply, user, body.remember);
  },

  async staffLogin(request: FastifyRequest, reply: FastifyReply) {
    const body = staffLoginBodySchema.parse(request.body);
    const staff = await authService.staffLogin(body);
    return startSession(reply, staff, body.remember, true);
  },

  async staffChangePassword(request: FastifyRequest) {
    const { currentPassword, newPassword } = staffChangePasswordBodySchema.parse(request.body);
    await authService.staffChangePassword(request.user.sub, currentPassword, newPassword);
    return { ok: true };
  },

  async totpSetup(request: FastifyRequest) {
    return authService.totpSetup(request.user.sub);
  },

  async totpEnable(request: FastifyRequest) {
    const { code } = totpCodeBodySchema.parse(request.body);
    return { user: toSessionUser(await authService.totpEnable(request.user.sub, code)) };
  },

  async logout(_request: FastifyRequest, reply: FastifyReply) {
    reply.clearCookie(SESSION_COOKIE, { path: "/" });
    return { ok: true };
  },

  async me(request: FastifyRequest) {
    if (request.staff) {
      // ข้อมูลพนักงานล่าสุดจาก DB (authenticate โหลดมาแล้ว) รวมสิทธิ์ปัจจุบันของบทบาท
      return { user: toSessionStaff(request.staff) };
    }
    const user = await authService.getUser(request.user.sub);
    return { user: toSessionUser(user) };
  },

  async selectPlan(request: FastifyRequest) {
    const { plan, billing } = selectPlanBodySchema.parse(request.body);
    const user = await authService.selectPlan(request.user.sub, plan, billing);
    return { user: toSessionUser(user) };
  },

  async forgotPassword(request: FastifyRequest) {
    await authService.forgotPassword(emailOnlyBodySchema.parse(request.body).email);
    return { sent: true };
  },

  async resetPassword(request: FastifyRequest) {
    const { token, password } = resetPasswordBodySchema.parse(request.body);
    await authService.resetPassword(token, password);
    return { ok: true };
  },
};
