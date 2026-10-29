import type { Plan } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";
import { AppError } from "@/utils/errors.js";

/**
 * แพ็กเกจและราคา (บาท) เก็บในตาราง Plan ให้ผู้ดูแลระบบแก้ได้ และโหลดเข้าหน่วยความจำไว้ให้ฟังก์ชัน sync เรียกใช้
 * limit = null คือไม่จำกัด ค่าตั้งต้นด้านล่างใช้สร้างตารางครั้งแรกเท่านั้น
 */
export type PlanId = string;
export type Cycle = "monthly" | "yearly";

export interface PlanDef {
  id: PlanId;
  name: string;
  description: string;
  monthly: number;
  yearly: number;
  limits: { tables: number | null; staff: number | null; branches: number };
  active: boolean;
  sortOrder: number;
  cta: string;
  perks: string[];
  featured: boolean;
}

export const DEFAULT_TRIAL_DAYS = 14;

export const SEED_PLANS: Omit<Plan, "createdAt" | "updatedAt">[] = [
  {
    id: "starter", name: "เริ่มต้น", description: "สำหรับร้านเล็กที่อยากเริ่มอย่างคล่องตัว",
    monthly: 399, yearly: 3_990, tablesLimit: 15, staffLimit: 10, branchesLimit: 1, active: true, sortOrder: 1,
    cta: "เลือกแพ็กเกจนี้", featured: false,
    perks: [
      "1 สาขา สูงสุด 15 โต๊ะ",
      "เมนูอาหารไม่จำกัด",
      "สั่งอาหารผ่านคิวอาร์โค้ด",
      "จัดการออร์เดอร์และหน้าจอครัว",
      "สรุปยอดขายและช่องทางชำระเงินประจำวัน",
    ],
  },
  {
    id: "growth", name: "เติบโต", description: "สำหรับร้านที่ต้องการดูแลได้ครบกว่า",
    monthly: 799, yearly: 7_990, tablesLimit: null, staffLimit: 10, branchesLimit: 1, active: true, sortOrder: 2,
    cta: "เริ่มทดลองฟรี", featured: true,
    perks: [
      "1 สาขา ไม่จำกัดจำนวนโต๊ะ",
      "ทุกอย่างในแพ็กเกจเริ่มต้น",
      "แบ่งสิทธิ์พนักงานได้ 10 บัญชี",
      "รายงานเชิงลึกและเมนูขายดี",
      "ทีมดูแลช่วยตั้งค่าร้าน",
    ],
  },
  {
    id: "multi", name: "หลายสาขา", description: "สำหรับธุรกิจที่พร้อมขยายความอร่อย",
    monthly: 1_490, yearly: 14_900, tablesLimit: null, staffLimit: 10, branchesLimit: 3, active: true, sortOrder: 3,
    cta: "เลือกแพ็กเกจนี้", featured: false,
    perks: [
      "ดูแลได้สูงสุด 3 สาขา",
      "ทุกอย่างในแพ็กเกจเติบโต",
      "ภาพรวมยอดขายแยกตามสาขา",
      "จัดการเมนูจากส่วนกลาง",
      "ทีมดูแลเฉพาะสำหรับธุรกิจ",
    ],
  },
];

export const toPlanDef = (row: Pick<Plan, "id" | "name" | "description" | "monthly" | "yearly" | "tablesLimit" | "staffLimit" | "branchesLimit" | "active" | "sortOrder" | "cta" | "perks" | "featured">): PlanDef => ({
  id: row.id,
  name: row.name,
  description: row.description,
  monthly: row.monthly,
  yearly: row.yearly,
  limits: { tables: row.tablesLimit, staff: row.staffLimit, branches: row.branchesLimit },
  active: row.active,
  sortOrder: row.sortOrder,
  cta: row.cta,
  perks: row.perks,
  featured: row.featured,
});

/** แพ็กเกจปัจจุบันในหน่วยความจำ (อ้างอิงเดียวกันตลอด โหลดใหม่จะเขียนทับเนื้อใน) */
export const PLANS: Record<PlanId, PlanDef> = {};

/** โหลดแพ็กเกจจากฐานข้อมูล ถ้ายังว่างจะใส่ค่าตั้งต้นให้ก่อน เรียกตอนเริ่มระบบและหลังผู้ดูแลแก้ */
export async function loadPlans() {
  if ((await prisma.plan.count()) === 0) {
    await prisma.plan.createMany({ data: SEED_PLANS });
  } else {
    // แถวเก่าที่เพิ่มคอลัมน์ perks ทีหลังจะเป็น NULL ซึ่ง filter ของ Prisma มองไม่เห็น
    await prisma.$executeRaw`UPDATE "Plan" SET "perks" = ARRAY[]::text[] WHERE "perks" IS NULL`;
    // แพ็กเกจตั้งต้นที่สร้างไว้ก่อนมีช่องจุดเด่น/ปุ่ม: เติมค่าตามต้นแบบให้ครั้งเดียว (ไม่ทับที่ผู้ดูแลกรอกเอง)
    for (const seed of SEED_PLANS) {
      await prisma.plan.updateMany({
        where: { id: seed.id, cta: "", perks: { isEmpty: true } },
        data: { cta: seed.cta, perks: seed.perks, featured: seed.featured },
      });
    }
  }
  await refreshPlans();
}

/** อ่านแพ็กเกจจาก DB มาแทนที่ในหน่วยความจำ (เรียกเป็นระยะ เพื่อให้หลายเครื่องเห็นการแก้ของผู้ดูแลตรงกัน) */
export async function refreshPlans() {
  const rows = await prisma.plan.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  for (const key of Object.keys(PLANS)) delete PLANS[key];
  for (const row of rows) PLANS[row.id] = toPlanDef(row);
}

export const isPlanId = (value: string | null | undefined): value is PlanId =>
  typeof value === "string" && Object.hasOwn(PLANS, value);

/** สมัคร/เปลี่ยนไปแพ็กเกจนี้ได้หรือไม่ (ต้องมีอยู่และยังเปิดขาย) */
export function assertSelectable(plan: string) {
  if (!isPlanId(plan) || !PLANS[plan]?.active) {
    throw new AppError(400, "แพ็กเกจนี้ไม่เปิดให้เลือกแล้ว", "PLAN_UNAVAILABLE");
  }
}

/** แพ็กเกจที่ใช้คิดสิทธิ์จริง: ยังไม่ได้เลือกแพ็กเกจ = สิทธิ์เท่าแพ็กเกจเติบโตระหว่างทดลอง */
export const effectivePlan = (plan: string | null | undefined): PlanDef => {
  if (isPlanId(plan)) return PLANS[plan]!;
  const fallback = PLANS.growth ?? Object.values(PLANS)[0];
  if (fallback) return fallback;
  return toPlanDef(SEED_PLANS[1]!);
};
