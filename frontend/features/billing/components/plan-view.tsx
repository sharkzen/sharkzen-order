"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { ConfirmDialog } from "@/components/ui";
import {
  findPlan,
  formatBaht,
  type BillingCycle,
  type PlanId,
  type PricingPlan,
} from "@/features/landing/data";
import { useCatalog } from "@/features/pricing/lib/catalog";
import type { BillingOverview, CheckoutChoice, Invoice, PayMethod, PlanChoice } from "@/features/billing/lib/billing-api";
import { formatDate } from "@/features/billing/lib/plan-status";
import { CurrentPlanCard } from "./current-plan-card";
import { InvoicesCard } from "./invoices-card";
import { PlanCards, type PlanCardState } from "./plan-cards";
import { UsageCard } from "./usage-card";

export interface PlanActions {
  /** ไปหน้าชำระเงินของ Stripe */
  checkout: (choice: CheckoutChoice) => Promise<void>;
  change: (choice: PlanChoice) => Promise<void>;
  portal: () => Promise<void>;
  cancel: () => Promise<void>;
  resume: () => Promise<void>;
}

interface PlanViewProps {
  overview: BillingOverview;
  invoices: Invoice[];
  now: number;
  actions: PlanActions;
}

const price = (plan: PricingPlan, billing: BillingCycle) => (billing === "yearly" ? plan.yearly : plan.monthly);

/** หน้าแพ็กเกจ (ไม่ดึงข้อมูลเอง รับข้อมูลและ actions จาก PlanWorkspace จึงใช้เรนเดอร์เป็น skeleton ได้) */
export function PlanView({ overview, invoices, now, actions }: PlanViewProps) {
  const { subscription: sub, usage } = overview;
  const catalog = useCatalog();
  const rank = (id: PlanId) => catalog?.plans.findIndex((plan) => plan.id === id) ?? -1;
  const [billing, setBilling] = useState<BillingCycle>(sub.billing);
  const [method, setMethod] = useState<PayMethod>(sub.method ?? "card");
  const [busy, setBusy] = useState<"current" | "portal" | "cancel" | PlanId | null>(null);
  const [changeTarget, setChangeTarget] = useState<PlanChoice | null>(null);
  /** เปลี่ยนแพ็กเกจระหว่างที่แพ็กเกจพร้อมเพย์เดิมยังไม่หมด: ต้องยืนยันก่อนเพราะวันที่เหลือไม่ถูกนำมาหัก */
  const [replaceTarget, setReplaceTarget] = useState<CheckoutChoice | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  /** สมัครตัดบัตรอัตโนมัติกับ Stripe อยู่ (เปลี่ยนแพ็กเกจผ่าน Stripe คิดส่วนต่างให้) */
  const onCard = sub.autoRenew && sub.status !== "CANCELED";

  async function run(key: NonNullable<typeof busy>, task: () => Promise<void>) {
    setBusy(key);
    try {
      await task();
    } finally {
      setBusy(null);
    }
  }

  /** ลดแพ็กเกจไม่ได้ถ้าการใช้งานตอนนี้เกินเพดานของแพ็กเกจปลายทาง */
  function blockedReason(plan: PricingPlan) {
    const limits = plan.limits;
    if (limits && usage.branches > limits.branches) {
      return `ตอนนี้มี ${usage.branches} สาขา แพ็กเกจนี้มีได้ ${limits.branches} สาขา`;
    }
    if (limits?.tables !== null && limits?.tables !== undefined && usage.tables > limits.tables) {
      return `ตอนนี้มี ${usage.tables} โต๊ะ ลดให้ไม่เกิน ${limits.tables} ก่อน`;
    }
    if (limits?.staff !== null && limits?.staff !== undefined && usage.staff > limits.staff) {
      return `ตอนนี้มีพนักงาน ${usage.staff} คน ลดให้ไม่เกิน ${limits.staff} ก่อน`;
    }
    return undefined;
  }

  function stateOf(plan: PricingPlan): PlanCardState {
    if (!onCard) {
      // ยังไม่ได้จ่าย หรือจ่ายพร้อมเพย์ (ต่ออายุเอง): ซื้อได้เสมอ แพ็กเกจที่ใช้อยู่เปลี่ยนข้อความเป็น "ต่ออายุ"
      const running = sub.paying && plan.id === sub.plan && billing === sub.billing;
      let cta = `สมัครแพ็กเกจ${plan.name}`;
      if (running) cta = method === "promptpay" ? "ต่ออายุด้วยพร้อมเพย์" : "เปลี่ยนเป็นตัดบัตรอัตโนมัติ";
      else if (sub.paying) cta = `เปลี่ยนเป็น${plan.name}`;
      return { current: running, trial: !sub.paying && sub.status === "TRIALING" && plan.id === sub.plan, cta };
    }
    const current = plan.id === sub.plan && billing === sub.billing;
    let cta: string;
    if (current) cta = "แพ็กเกจปัจจุบัน";
    else if (plan.id === sub.plan) cta = billing === "yearly" ? "สลับเป็นรายปี" : "สลับเป็นรายเดือน";
    else cta = rank(plan.id) > rank(sub.plan) ? `อัปเกรดเป็น${plan.name}` : `เปลี่ยนเป็น${plan.name}`;
    return { current, trial: false, disabled: current, cta, blockedReason: current ? undefined : blockedReason(plan) };
  }

  function choose(plan: PricingPlan) {
    if (onCard) {
      setChangeTarget({ plan: plan.id, billing });
      return;
    }
    const choice = { plan: plan.id, billing, method };
    // จ่ายพร้อมเพย์ซ้ำคนละแพ็กเกจ/รอบบิล ทั้งที่ของเดิมยังไม่หมด: ให้ยืนยันก่อน
    const sameRunning = plan.id === sub.plan && billing === sub.billing;
    if (sub.paying && !sameRunning && method === "promptpay") setReplaceTarget(choice);
    else void run(plan.id, () => actions.checkout(choice));
  }

  const target = changeTarget ? findPlan(catalog, changeTarget.plan) : undefined;
  const currentPlan = findPlan(catalog, sub.plan);

  return (
    <div className="flex w-full flex-col gap-5 sm:gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-foreground text-[28px] leading-tight font-semibold">แพ็กเกจและการชำระเงิน</h1>
        <p className="text-muted-foreground text-[13px]">ดูแพ็กเกจที่ใช้อยู่ สมัครหรือเปลี่ยนแพ็กเกจ และดูประวัติการชำระเงิน</p>
      </div>

      <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <CurrentPlanCard
          overview={overview}
          now={now}
          busy={busy === "current" || busy === "portal" || busy === "cancel"}
          onSubscribe={() => run("current", () => actions.checkout({ plan: sub.plan, billing: sub.billing, method }))}
          onRenew={() => run("current", () => actions.checkout({ plan: sub.plan, billing: sub.billing, method: "promptpay" }))}
          onUseCard={() => run("current", () => actions.checkout({ plan: sub.plan, billing: sub.billing, method: "card" }))}
          onPortal={() => run("portal", actions.portal)}
          onCancel={() => setConfirmCancel(true)}
          onResume={() => run("cancel", actions.resume)}
        />
        <UsageCard overview={overview} />
      </div>

      <section aria-labelledby="plans-heading" className="flex flex-col gap-4">
        <h2 id="plans-heading" className="text-foreground text-[17px] font-semibold">
          {sub.paying ? "เปลี่ยนแพ็กเกจ" : "เลือกแพ็กเกจ"}
        </h2>
        <PlanCards
          billing={billing}
          onBillingChange={setBilling}
          method={method}
          onMethodChange={setMethod}
          methodLocked={onCard}
          stateOf={stateOf}
          busyPlan={typeof busy === "string" && busy !== "current" && busy !== "portal" && busy !== "cancel" ? busy : null}
          onChoose={choose}
        />
      </section>

      <InvoicesCard invoices={invoices} />

      <p className="text-muted-foreground flex items-start gap-2 text-xs">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        การชำระเงินดำเนินการโดย Stripe ระบบไม่เก็บข้อมูลบัตรของคุณ ราคายังไม่รวมภาษีมูลค่าเพิ่ม
        และยกเลิกได้ทุกเมื่อ ใช้งานต่อได้จนสิ้นรอบบิลที่ชำระแล้ว
      </p>

      <ConfirmDialog
        open={changeTarget !== null}
        title={target ? `เปลี่ยนเป็นแพ็กเกจ${target.name}?` : "เปลี่ยนแพ็กเกจ?"}
        description={
          target && changeTarget ? (
            <span className="flex flex-col gap-2">
              <span>
                จาก {currentPlan?.name} ({sub.billing === "yearly" ? "รายปี" : "รายเดือน"}) เป็น {target.name} (
                {changeTarget.billing === "yearly" ? "รายปี" : "รายเดือน"}) ราคา ฿
                {formatBaht(price(target, changeTarget.billing))}
                {changeTarget.billing === "yearly" ? " ต่อปี" : " ต่อเดือน"}
              </span>
              <span>
                มีผลทันที Stripe จะคิดส่วนต่างตามสัดส่วนวันที่เหลือในรอบบิลนี้ และปรับยอดในใบแจ้งหนี้ถัดไปให้อัตโนมัติ
              </span>
            </span>
          ) : null
        }
        confirmLabel="ยืนยันเปลี่ยนแพ็กเกจ"
        onCancel={() => setChangeTarget(null)}
        onConfirm={() => {
          const choice = changeTarget;
          setChangeTarget(null);
          if (choice) void run(choice.plan, () => actions.change(choice));
        }}
      />

      <ConfirmDialog
        open={replaceTarget !== null}
        title="เปลี่ยนแพ็กเกจก่อนหมดอายุ?"
        description={
          <>
            แพ็กเกจเดิมยังใช้ได้ถึง{" "}
            <strong>{sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : "สิ้นรอบบิล"}</strong>{" "}
            การจ่ายพร้อมเพย์รอบใหม่จะเริ่มนับจากวันนี้ และ <strong>ไม่นำวันที่เหลือของแพ็กเกจเดิมมาหัก</strong>{" "}
            ถ้าต้องการต่ออายุแพ็กเกจเดิมต่อท้ายรอบ ให้เลือกแพ็กเกจและรอบบิลเดิม
          </>
        }
        confirmLabel="ไปหน้าชำระเงิน"
        onCancel={() => setReplaceTarget(null)}
        onConfirm={() => {
          const choice = replaceTarget;
          setReplaceTarget(null);
          if (choice) void run(choice.plan, () => actions.checkout(choice));
        }}
      />

      <ConfirmDialog
        open={confirmCancel}
        title="ยกเลิกแพ็กเกจ?"
        description={
          <>
            คุณยังใช้งานได้ถึง{" "}
            <strong>{sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : "สิ้นรอบบิล"}</strong>{" "}
            หลังจากนั้นจะไม่มีการเก็บเงินอีก ข้อมูลร้านยังอยู่ครบ และกดต่ออายุได้ทุกเมื่อก่อนวันดังกล่าว
          </>
        }
        confirmLabel="ยืนยันยกเลิก"
        tone="danger"
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false);
          void run("cancel", actions.cancel);
        }}
      />
    </div>
  );
}
