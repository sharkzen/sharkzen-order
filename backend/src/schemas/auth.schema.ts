import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email("อีเมลไม่ถูกต้อง"));
const password = z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร").max(128);

const planSchema = z.enum(["starter", "growth", "multi"]);
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
});

export const resetPasswordBodySchema = z.object({
  token: z.string().min(20).max(200),
  password,
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
