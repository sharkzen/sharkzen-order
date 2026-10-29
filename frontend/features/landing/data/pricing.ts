export type BillingCycle = "monthly" | "yearly";
/** รหัสแพ็กเกจ (ผู้ดูแลระบบเป็นคนสร้าง จึงเป็นข้อความอิสระ) */
export type PlanId = string;

export interface PricingPlan {
  id: PlanId;
  name: string;
  description: string;
  /** ราคาต่อเดือน (บาท) เมื่อจ่ายรายเดือน */
  monthly: number;
  /** ราคาต่อปี (บาท) เมื่อจ่ายรายปี */
  yearly: number;
  cta: string;
  featured: boolean;
  perks: string[];
  /** เพดานการใช้งาน null = ไม่จำกัด */
  limits: { tables: number | null; staff: number | null; branches: number };
}

/** ข้อมูลราคาทั้งชุดจาก GET /public/plans (ตั้งค่าที่หน้าผู้ดูแลระบบ ไม่มีค่าตายตัวในโค้ด) */
export interface Catalog {
  plans: PricingPlan[];
  trialDays: number;
  /** รายปีแถมฟรีกี่เดือน */
  yearlyFreeMonths: number;
}

export const findPlan = (catalog: Catalog | null | undefined, id: string | null | undefined) =>
  catalog?.plans.find((plan) => plan.id === id);

/** แพ็กเกจที่เลือกไว้ก่อนในหน้าเลือก: ตัวแนะนำ ถ้าไม่มีใช้ตัวแรก */
export const defaultPlan = (catalog: Catalog | null | undefined) =>
  catalog?.plans.find((plan) => plan.featured) ?? catalog?.plans[0];

export const parseBilling = (value: string | undefined): BillingCycle =>
  value === "monthly" ? "monthly" : "yearly";

export const formatBaht = (amount: number) => amount.toLocaleString("en-US");

/** รูปแบบป้ายราคาไทย เช่น 333.- */
export const formatPrice = (amount: number) => `${formatBaht(amount)}.-`;

/** ราคาเฉลี่ยต่อเดือนเมื่อจ่ายรายปี */
export const yearlyPerMonth = (plan: PricingPlan) => Math.round(plan.yearly / 12);

/** ประหยัดได้กี่บาทต่อปีเมื่อเลือกรายปีแทนรายเดือน */
export const yearlySavings = (plan: PricingPlan) => Math.max(0, plan.monthly * 12 - plan.yearly);
