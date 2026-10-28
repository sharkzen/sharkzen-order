import type { BillingCycle, PlanId } from "@/features/landing/data";
import { clientHttp } from "@/lib/http/client";

/** card = ตัดบัตรอัตโนมัติ, promptpay = จ่ายครั้งเดียวต่อรอบบิล ต่ออายุเอง */
export type PayMethod = "card" | "promptpay";

export type SubscriptionStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED";

export interface Subscription {
  plan: PlanId;
  billing: BillingCycle;
  status: SubscriptionStatus;
  /** สิ้นสุดช่วงทดลองฟรี */
  trialEndsAt: string | null;
  /** สิ้นสุดรอบบิลปัจจุบัน (ตัดเงินรอบถัดไปวันนี้) */
  currentPeriodEnd: string | null;
  /** ยกเลิกแล้ว ใช้ได้จนสิ้นรอบบิล */
  cancelAtPeriodEnd: boolean;
  /** มีแพ็กเกจแบบชำระเงินที่ใช้งานอยู่ (ตัดบัตรอัตโนมัติ หรือพร้อมเพย์ที่ยังไม่หมดอายุ) */
  paying: boolean;
  /** วิธีชำระล่าสุด */
  method: PayMethod | null;
  /** ตัดบัตรอัตโนมัติทุกรอบ (false = ต้องต่ออายุเอง) */
  autoRenew: boolean;
}

export interface BillingOverview {
  subscription: Subscription;
  usage: { tables: number; staff: number };
  /** null = ไม่จำกัด */
  limits: { tables: number | null; staff: number | null };
}

export interface Invoice {
  id: string;
  number: string | null;
  /** รายการที่ซื้อ เช่น "แพ็กเกจเติบโต (1 เดือน) • พร้อมเพย์" */
  description: string | null;
  date: string;
  amount: number;
  status: "draft" | "open" | "paid" | "uncollectible" | "void" | null;
  pdfUrl: string | null;
  hostedUrl: string | null;
}

export interface PlanChoice {
  plan: PlanId;
  billing: BillingCycle;
}

export interface CheckoutChoice extends PlanChoice {
  method: PayMethod;
}

export const billingApi = {
  overview: (signal?: AbortSignal) =>
    clientHttp.get<BillingOverview>("/billing", { signal }).then((res) => res.data),
  invoices: (signal?: AbortSignal) =>
    clientHttp.get<Invoice[]>("/billing/invoices", { signal }).then((res) => res.data),

  /** คืน URL หน้าชำระเงินของ Stripe */
  checkout: (choice: CheckoutChoice) =>
    clientHttp.post<{ url: string | null }>("/billing/checkout", choice).then((res) => res.data.url),
  /** กลับจากหน้าชำระเงิน: บันทึกสถานะล่าสุดจาก Stripe */
  sync: (sessionId: string) =>
    clientHttp.post<Subscription>("/billing/sync", { sessionId }).then((res) => res.data),
  change: (choice: PlanChoice) =>
    clientHttp.post<Subscription>("/billing/change", choice).then((res) => res.data),
  cancel: () => clientHttp.post<Subscription>("/billing/cancel").then((res) => res.data),
  resume: () => clientHttp.post<Subscription>("/billing/resume").then((res) => res.data),
  portal: () => clientHttp.post<{ url: string }>("/billing/portal").then((res) => res.data.url),
};
