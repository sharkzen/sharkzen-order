/**
 * แพ็กเกจและราคา (บาท) ต้องตรงกับ frontend/features/landing/data/pricing.ts
 * limit = null คือไม่จำกัด
 */
export type PlanId = "starter" | "growth" | "multi";
export type Cycle = "monthly" | "yearly";

export interface PlanDef {
  id: PlanId;
  name: string;
  monthly: number;
  yearly: number;
  limits: { tables: number | null; staff: number | null };
}

export const TRIAL_DAYS = 14;

export const PLANS: Record<PlanId, PlanDef> = {
  starter: { id: "starter", name: "เริ่มต้น", monthly: 399, yearly: 3_990, limits: { tables: 15, staff: 10 } },
  growth: { id: "growth", name: "เติบโต", monthly: 799, yearly: 7_990, limits: { tables: null, staff: 10 } },
  multi: { id: "multi", name: "หลายสาขา", monthly: 1_490, yearly: 14_900, limits: { tables: null, staff: 10 } },
};

export const isPlanId = (value: string | null | undefined): value is PlanId =>
  value === "starter" || value === "growth" || value === "multi";

/** แพ็กเกจที่ใช้คิดสิทธิ์จริง: ยังไม่ได้เลือกแพ็กเกจ = สิทธิ์เท่าแพ็กเกจเติบโตระหว่างทดลอง */
export const effectivePlan = (plan: string | null | undefined): PlanDef =>
  isPlanId(plan) ? PLANS[plan] : PLANS.growth;
