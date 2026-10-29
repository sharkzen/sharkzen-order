import { z } from "zod";

const optionalIso = z.string().datetime().nullable().optional();
const limit = z.number().int().min(1).max(100_000).nullable();

export const listQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
  status: z.string().max(20).default("all"),
  plan: z.string().max(40).default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(15),
});

export const reasonBodySchema = z.object({ reason: z.string().trim().max(300).default("") });

export const subscriptionPatchSchema = z.object({
  plan: z.string().min(1).max(40).optional(),
  billing: z.enum(["monthly", "yearly"]).optional(),
  status: z.enum(["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED"]).optional(),
  trialEndsAt: optionalIso,
  currentPeriodEnd: optionalIso,
  /** เพิ่ม/ลดวันของวันสิ้นสุดที่ใช้อยู่ (ช่วงทดลอง หรือรอบบิล) ติดลบ = ลดวัน */
  extendDays: z.number().int().min(-3650).max(3650).optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
});

const planFields = {
  name: z.string().trim().min(1, "กรอกชื่อแพ็กเกจ").max(40),
  description: z.string().trim().max(120).default(""),
  monthly: z.number().int().min(0).max(1_000_000),
  yearly: z.number().int().min(0).max(10_000_000),
  tablesLimit: limit,
  staffLimit: limit,
  branchesLimit: z.number().int().min(1).max(1000),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(1000).default(0),
  cta: z.string().trim().max(40).default(""),
  perks: z.array(z.string().trim().min(1).max(120)).max(12).default([]),
  featured: z.boolean().default(false),
};

export const createPlanBodySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{2,30}$/, "รหัสแพ็กเกจใช้ a-z 0-9 และ - ความยาว 2-30 ตัว"),
  ...planFields,
});
export const updatePlanBodySchema = z.object(planFields);

export const settingsBodySchema = z.object({
  trialDays: z.number().int().min(0).max(365),
  yearlyFreeMonths: z.number().int().min(0).max(11),
  supportEmail: z.string().trim().max(120),
  supportPhone: z.string().trim().max(40),
  supportLine: z.string().trim().max(60),
});

export const idParamsSchema = z.object({ id: z.string().min(1).max(60) });
