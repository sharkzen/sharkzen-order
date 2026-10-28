import { findPlan, formatBaht, type PricingPlan } from "@/features/landing/data";
import type { Subscription } from "./billing-api";

const DAY_MS = 86_400_000;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "numeric" });

export const daysUntil = (iso: string, now: number) => Math.ceil((new Date(iso).getTime() - now) / DAY_MS);

export interface PlanStatus {
  label: string;
  tone: "success" | "info" | "warning" | "danger" | "neutral";
  /** ข้อความอธิบายใต้ชื่อแพ็กเกจ */
  detail: string;
  /** เหลือกี่วัน (ทดลอง) */
  trialDaysLeft: number | null;
}

/** สรุปสถานะการสมัครเป็นข้อความที่เจ้าของร้านอ่านแล้วรู้ว่าต้องทำอะไรต่อ */
export function describeStatus(sub: Subscription, now: number): PlanStatus {
  const plan = findPlan(sub.plan);
  const price = plan ? (sub.billing === "yearly" ? plan.yearly : plan.monthly) : 0;
  const cycle = sub.billing === "yearly" ? "ปีละ" : "เดือนละ";

  if (sub.status === "TRIALING") {
    const left = sub.trialEndsAt ? daysUntil(sub.trialEndsAt, now) : 0;
    if (left <= 0 && !sub.paying) {
      return {
        label: "หมดช่วงทดลองแล้ว",
        tone: "danger",
        detail: "สมัครแพ็กเกจเพื่อใช้งานต่อโดยไม่สะดุด",
        trialDaysLeft: 0,
      };
    }
    return {
      label: `ทดลองใช้ฟรี เหลือ ${left} วัน`,
      tone: left <= 3 ? "warning" : "info",
      detail: sub.paying
        ? `เริ่มเก็บเงิน ${cycle} ฿${formatBaht(price)} ในวันที่ ${formatDate(sub.trialEndsAt ?? sub.currentPeriodEnd ?? "")}`
        : `สิ้นสุด ${sub.trialEndsAt ? formatDate(sub.trialEndsAt) : "-"} • ยังไม่ผูกบัตร ไม่มีการเก็บเงิน`,
      trialDaysLeft: left,
    };
  }
  if (sub.status === "PAST_DUE") {
    return {
      label: "ชำระเงินไม่สำเร็จ",
      tone: "danger",
      detail: "อัปเดตบัตรเพื่อให้ Stripe ลองตัดเงินอีกครั้ง",
      trialDaysLeft: null,
    };
  }
  const byPromptpay = sub.method === "promptpay" && !sub.autoRenew;
  if (sub.status === "CANCELED" && byPromptpay) {
    return {
      label: "หมดอายุแล้ว",
      tone: "danger",
      detail: `${sub.currentPeriodEnd ? `หมดอายุเมื่อ ${formatDate(sub.currentPeriodEnd)} • ` : ""}ต่ออายุเพื่อใช้งานต่อโดยไม่สะดุด`,
      trialDaysLeft: null,
    };
  }
  if (sub.status === "CANCELED") {
    return {
      label: "ยกเลิกแล้ว",
      tone: "neutral",
      detail: sub.currentPeriodEnd ? `สิ้นสุดเมื่อ ${formatDate(sub.currentPeriodEnd)} สมัครใหม่ได้ทุกเมื่อ` : "สมัครใหม่ได้ทุกเมื่อ",
      trialDaysLeft: null,
    };
  }
  if (sub.cancelAtPeriodEnd) {
    return {
      label: "ยกเลิกแล้ว ใช้ได้จนสิ้นรอบบิล",
      tone: "warning",
      detail: sub.currentPeriodEnd ? `ใช้งานได้ถึง ${formatDate(sub.currentPeriodEnd)} หลังจากนั้นจะไม่เก็บเงินอีก` : "",
      trialDaysLeft: null,
    };
  }
  if (byPromptpay && sub.currentPeriodEnd) {
    const left = daysUntil(sub.currentPeriodEnd, now);
    return {
      label: left <= 7 ? `ใกล้หมดอายุ เหลือ ${left} วัน` : "ใช้งานอยู่",
      tone: left <= 7 ? "warning" : "success",
      detail: `ชำระด้วยพร้อมเพย์ • ใช้ได้ถึง ${formatDate(sub.currentPeriodEnd)} • ไม่ตัดเงินอัตโนมัติ ต้องต่ออายุเอง`,
      trialDaysLeft: null,
    };
  }
  return {
    label: "ใช้งานอยู่",
    tone: "success",
    detail: sub.currentPeriodEnd
      ? `ตัดเงินรอบถัดไป ${formatDate(sub.currentPeriodEnd)} • ${cycle} ฿${formatBaht(price)}`
      : "",
    trialDaysLeft: null,
  };
}

export type { PricingPlan };

/** เพดานการใช้งานต่อแพ็กเกจ ต้องตรงกับ backend/src/lib/plans.ts (null = ไม่จำกัด) */
export const PLAN_LIMITS: Record<string, { tables: number | null; staff: number | null }> = {
  starter: { tables: 15, staff: 10 },
  growth: { tables: null, staff: 10 },
  multi: { tables: null, staff: 10 },
};
