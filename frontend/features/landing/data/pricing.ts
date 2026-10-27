export type BillingCycle = "monthly" | "yearly";
export type PlanId = "starter" | "growth" | "multi";

export interface PricingPlan {
  id: PlanId;
  name: string;
  description: string;
  /** ราคาต่อเดือน (บาท) เมื่อจ่ายรายเดือน */
  monthly: number;
  /** ราคาต่อปี (บาท) เมื่อจ่ายรายปี = จ่าย 10 เดือน ใช้ 12 เดือน */
  yearly: number;
  cta: string;
  featured?: boolean;
  perks: string[];
}

/** รายปีแถมฟรีกี่เดือน (ใช้แสดงในป้ายและสรุปราคา) */
export const YEARLY_FREE_MONTHS = 2;
export const TRIAL_DAYS = 14;

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "เริ่มต้น",
    description: "สำหรับร้านเล็กที่อยากเริ่มอย่างคล่องตัว",
    monthly: 399,
    yearly: 3_990,
    cta: "เลือกแพ็กเกจนี้",
    perks: [
      "1 สาขา สูงสุด 15 โต๊ะ",
      "เมนูอาหารไม่จำกัด",
      "สั่งอาหารผ่านคิวอาร์โค้ด",
      "จัดการออร์เดอร์และหน้าจอครัว",
      "สรุปยอดขายและช่องทางชำระเงินประจำวัน",
    ],
  },
  {
    id: "growth",
    name: "เติบโต",
    description: "สำหรับร้านที่ต้องการดูแลได้ครบกว่า",
    monthly: 799,
    yearly: 7_990,
    cta: "เริ่มทดลองฟรี",
    featured: true,
    perks: [
      "1 สาขา ไม่จำกัดจำนวนโต๊ะ",
      "ทุกอย่างในแพ็กเกจเริ่มต้น",
      "แบ่งสิทธิ์พนักงานได้ 10 บัญชี",
      "รายงานเชิงลึกและเมนูขายดี",
      "ทีมดูแลช่วยตั้งค่าร้าน",
    ],
  },
  {
    id: "multi",
    name: "หลายสาขา",
    description: "สำหรับธุรกิจที่พร้อมขยายความอร่อย",
    monthly: 1_490,
    yearly: 14_900,
    cta: "เลือกแพ็กเกจนี้",
    perks: [
      "ดูแลได้สูงสุด 3 สาขา",
      "ทุกอย่างในแพ็กเกจเติบโต",
      "ภาพรวมยอดขายแยกตามสาขา",
      "จัดการเมนูจากส่วนกลาง",
      "ทีมดูแลเฉพาะสำหรับธุรกิจ",
    ],
  },
];

export const DEFAULT_PLAN_ID: PlanId = "growth";

export const findPlan = (id: string | undefined) =>
  PRICING_PLANS.find((plan) => plan.id === id);

export const parseBilling = (value: string | undefined): BillingCycle =>
  value === "monthly" ? "monthly" : "yearly";

export const formatBaht = (amount: number) => amount.toLocaleString("en-US");

/** ราคาเฉลี่ยต่อเดือนเมื่อจ่ายรายปี */
export const yearlyPerMonth = (plan: PricingPlan) => Math.round(plan.yearly / 12);

/** ประหยัดได้กี่บาทต่อปีเมื่อเลือกรายปีแทนรายเดือน */
export const yearlySavings = (plan: PricingPlan) => plan.monthly * 12 - plan.yearly;
