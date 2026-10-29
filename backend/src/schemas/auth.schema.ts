import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email("อีเมลไม่ถูกต้อง"));
const password = z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร").max(128);

const planSchema = z.string().min(1).max(40);
const billingSchema = z.enum(["monthly", "yearly"]);

export const registerBodySchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email,
  password,
  acceptedTerms: z.literal(true, "ต้องยอมรับข้อกำหนดก่อนสมัคร"),
  marketingConsent: z.boolean().default(false),
  plan: planSchema.optional(),
  billing: billingSchema.optional(),
});

export const selectPlanBodySchema = z.object({ plan: planSchema, billing: billingSchema });

export const verifyEmailBodySchema = z.object({
  email,
  code: z.string().regex(/^\d{6}$/, "รหัสต้องเป็นตัวเลข 6 หลัก"),
});

export const emailOnlyBodySchema = z.object({ email });

export const loginBodySchema = z.object({
  email,
  password: z.string().min(1),
  remember: z.boolean().default(false),
  /** รหัส 2FA 6 หลัก (ผู้ดูแลระบบที่เปิด 2FA) */
  code: z.string().regex(/^\d{6}$/, "รหัส 2FA ต้องเป็นตัวเลข 6 หลัก").optional(),
});

export const staffLoginBodySchema = z.object({
  shopCode: z.string().trim().toUpperCase().min(4).max(20),
  username: z.string().trim().toLowerCase().min(1).max(60),
  password: z.string().min(1).max(128),
  remember: z.boolean().default(false),
});

export const staffChangePasswordBodySchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: password,
});

export const totpCodeBodySchema = z.object({ code: z.string().regex(/^\d{6}$/, "รหัส 2FA ต้องเป็นตัวเลข 6 หลัก") });

export const resetPasswordBodySchema = z.object({
  token: z.string().min(20).max(200),
  password,
});

export type StaffLoginBody = z.infer<typeof staffLoginBodySchema>;
export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
