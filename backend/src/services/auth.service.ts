import type { AuthCodeType, BillingCycle, User } from "@prisma/client";
import { env } from "@/config/env.js";
import {
  generateOtp,
  generateToken,
  hashCode,
  hashPassword,
  safeEqualHex,
  verifyPassword,
} from "@/lib/crypto.js";
import { billingService } from "@/services/billing.service.js";
import { sendMail } from "@/lib/mailer.js";
import { prisma } from "@/lib/prisma.js";
import type { LoginBody, RegisterBody } from "@/schemas/auth.schema.js";
import { otpEmail, resetPasswordEmail } from "@/utils/email-templates.js";
import { AppError } from "@/utils/errors.js";

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const RESET_TTL_MINUTES = 30;

const minutesFromNow = (minutes: number) => new Date(Date.now() + minutes * 60_000);

// ใช้เทียบรหัสผ่านเมื่อไม่พบผู้ใช้ เพื่อไม่ให้เวลาตอบต่างกันจนเดาได้ว่าอีเมลมีในระบบ
const DUMMY_HASH = await hashPassword("dummy-password-for-timing");

export const toSessionUser = (user: User) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  plan: user.plan,
  billingCycle: user.billingCycle,
});

const toBillingCycle = (billing?: "monthly" | "yearly"): BillingCycle | undefined =>
  billing === "yearly" ? "YEARLY" : billing === "monthly" ? "MONTHLY" : undefined;

async function cooldownLeft(userId: string, type: AuthCodeType) {
  const last = await prisma.authCode.findFirst({
    where: { userId, type },
    orderBy: { createdAt: "desc" },
  });
  if (!last) return 0;
  const elapsed = (Date.now() - last.createdAt.getTime()) / 1000;
  return Math.max(0, Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed));
}

/** ยกเลิกรหัสเก่าที่ยังไม่ใช้ แล้วออกรหัสใหม่ */
async function issueCode(userId: string, type: AuthCodeType, code: string, ttlMinutes: number) {
  await prisma.$transaction([
    prisma.authCode.updateMany({
      where: { userId, type, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    prisma.authCode.create({
      data: {
        userId,
        type,
        codeHash: hashCode(code),
        expiresAt: minutesFromNow(ttlMinutes),
      },
    }),
  ]);
}

async function sendOtp(user: User) {
  const wait = await cooldownLeft(user.id, "EMAIL_OTP");
  if (wait > 0) {
    throw new AppError(429, `ขอรหัสใหม่ได้อีกครั้งใน ${wait} วินาที`, "OTP_COOLDOWN");
  }
  const code = generateOtp();
  await issueCode(user.id, "EMAIL_OTP", code, OTP_TTL_MINUTES);
  await sendMail(otpEmail(user.email, user.firstName, code, OTP_TTL_MINUTES));
}

export const authService = {
  async register(body: RegisterBody) {
    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing?.emailVerifiedAt) {
      throw new AppError(409, "อีเมลนี้ถูกใช้งานแล้ว ลองเข้าสู่ระบบแทน", "EMAIL_TAKEN");
    }

    const data = {
      firstName: body.firstName,
      lastName: body.lastName,
      passwordHash: await hashPassword(body.password),
      acceptedTermsAt: new Date(),
      marketingConsent: body.marketingConsent,
      plan: body.plan,
      billingCycle: toBillingCycle(body.billing),
    };
    // สมัครซ้ำด้วยอีเมลที่ยังไม่ยืนยัน = อัปเดตข้อมูลแล้วส่งรหัสใหม่
    const user = existing
      ? await prisma.user.update({ where: { id: existing.id }, data })
      : await prisma.user.create({
          data: {
            email: body.email,
            ...data,
            // ทุกบัญชีมีร้านของตัวเองตั้งแต่สมัคร (เปลี่ยนชื่อได้ภายหลัง)
            shop: { create: { name: `ร้านของ ${body.firstName}` } },
          },
        });

    try {
      await sendOtp(user);
    } catch (error) {
      // กดสมัครซ้ำเร็วๆ: รหัสเดิมยังใช้ได้ ไม่ต้องล้มเหลว
      if (!(error instanceof AppError && error.code === "OTP_COOLDOWN")) throw error;
    }
    return { email: user.email };
  },

  async resendOtp(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // ไม่บอกว่าอีเมลมีอยู่หรือไม่
    if (!user || user.emailVerifiedAt) return;
    await sendOtp(user);
  },

  async verifyEmail(email: string, code: string) {
    const invalid = new AppError(400, "รหัสไม่ถูกต้องหรือหมดอายุ", "OTP_INVALID");
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerifiedAt) throw invalid;

    const record = await prisma.authCode.findFirst({
      where: { userId: user.id, type: "EMAIL_OTP", consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (!record || record.expiresAt < new Date()) {
      throw new AppError(400, "รหัสหมดอายุแล้ว กรุณาขอรหัสใหม่", "OTP_EXPIRED");
    }
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      throw new AppError(429, "กรอกรหัสผิดหลายครั้งเกินไป กรุณาขอรหัสใหม่", "OTP_LOCKED");
    }

    if (!safeEqualHex(record.codeHash, hashCode(code))) {
      const { attempts } = await prisma.authCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      const left = OTP_MAX_ATTEMPTS - attempts;
      throw new AppError(
        400,
        left > 0
          ? `รหัสไม่ถูกต้อง เหลือโอกาสอีก ${left} ครั้ง`
          : "กรอกรหัสผิดหลายครั้งเกินไป กรุณาขอรหัสใหม่",
        left > 0 ? "OTP_INVALID" : "OTP_LOCKED",
      );
    }

    const [, verified] = await prisma.$transaction([
      prisma.authCode.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);
    return verified;
  },

  async login({ email, password }: LoginBody) {
    const user = await prisma.user.findUnique({ where: { email } });
    const { ok, needsRehash } = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw new AppError(401, "อีเมลหรือรหัสผ่านไม่ถูกต้อง", "INVALID_CREDENTIALS");

    if (needsRehash) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await hashPassword(password) },
      });
    }

    if (!user.emailVerifiedAt) {
      await sendOtp(user).catch(() => undefined);
      throw new AppError(403, "ยังไม่ได้ยืนยันอีเมล เราส่งรหัสไปให้แล้ว", "EMAIL_NOT_VERIFIED");
    }
    return user;
  },

  async selectPlan(userId: string, plan: string, billing: "monthly" | "yearly") {
    // เริ่มช่วงทดลองฟรีของแพ็กเกจที่เลือก (ถ้าสมัครแบบชำระเงินอยู่แล้วจะไม่แตะต้อง)
    if (plan === "starter" || plan === "growth" || plan === "multi") {
      await billingService.selectTrialPlan(userId, plan, billing);
    }
    return prisma.user.update({
      where: { id: userId },
      data: { plan, billingCycle: toBillingCycle(billing) },
    });
  },

  async getUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError(401, "Unauthorized");
    return user;
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // ตอบเหมือนกันเสมอ ไม่เปิดเผยว่าอีเมลนี้มีบัญชีหรือไม่
    if (!user?.emailVerifiedAt) return;
    if ((await cooldownLeft(user.id, "PASSWORD_RESET")) > 0) return;

    const token = generateToken();
    await issueCode(user.id, "PASSWORD_RESET", token, RESET_TTL_MINUTES);
    const link = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
    await sendMail(resetPasswordEmail(user.email, user.firstName, link, RESET_TTL_MINUTES));
  },

  async resetPassword(token: string, password: string) {
    const record = await prisma.authCode.findFirst({
      where: {
        type: "PASSWORD_RESET",
        codeHash: hashCode(token),
        consumedAt: null,
      },
    });
    if (!record || record.expiresAt < new Date()) {
      throw new AppError(
        400,
        "ลิงก์หมดอายุหรือถูกใช้ไปแล้ว กรุณาขอลิงก์ใหม่",
        "RESET_TOKEN_INVALID",
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash: await hashPassword(password) },
      }),
      prisma.authCode.updateMany({
        where: {
          userId: record.userId,
          type: "PASSWORD_RESET",
          consumedAt: null,
        },
        data: { consumedAt: new Date() },
      }),
    ]);
  },
};
