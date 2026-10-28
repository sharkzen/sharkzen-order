"use client";

import { Check, CreditCard, QrCode } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  PRICING_PLANS,
  YEARLY_FREE_MONTHS,
  formatPrice,
  yearlyPerMonth,
  yearlySavings,
  type BillingCycle,
  type PlanId,
  type PricingPlan,
} from "@/features/landing/data";
import type { PayMethod } from "@/features/billing/lib/billing-api";

const CYCLES: { value: BillingCycle; label: string }[] = [
  { value: "monthly", label: "รายเดือน" },
  { value: "yearly", label: "รายปี" },
];

const METHODS: {
  value: PayMethod;
  title: string;
  icon: typeof CreditCard;
  description: (billing: BillingCycle) => string;
}[] = [
  {
    value: "card",
    title: "บัตรเครดิต / เดบิต",
    icon: CreditCard,
    description: () => "ตัดเงินอัตโนมัติทุกรอบบิล ไม่ต้องจำวันต่ออายุ ยกเลิกได้ทุกเมื่อ",
  },
  {
    value: "promptpay",
    title: "พร้อมเพย์ (สแกน QR)",
    icon: QrCode,
    description: (billing) =>
      `จ่ายครั้งเดียว ใช้ได้ ${billing === "yearly" ? "12 เดือน" : "1 เดือน"} ไม่ตัดเงินอัตโนมัติ ต้องต่ออายุเองเมื่อใกล้หมด`,
  },
];

export interface PlanCardState {
  /** แพ็กเกจและรอบบิลที่ใช้อยู่จริง ณ ตอนนี้ (สมัครแบบชำระเงินแล้วเท่านั้น) */
  current: boolean;
  /** แพ็กเกจที่กำลังทดลองอยู่ */
  trial: boolean;
  /** ปุ่มกดไม่ได้ (เช่น เป็นแพ็กเกจปัจจุบันที่ตัดบัตรอัตโนมัติอยู่แล้ว) */
  disabled?: boolean;
  /** ปุ่มกดไม่ได้ พร้อมเหตุผลที่แสดงใต้ปุ่ม */
  blockedReason?: string;
  /** ข้อความบนปุ่ม */
  cta: string;
}

interface PlanCardsProps {
  billing: BillingCycle;
  onBillingChange: (billing: BillingCycle) => void;
  method: PayMethod;
  onMethodChange: (method: PayMethod) => void;
  /** ล็อกวิธีชำระ (สมัครตัดบัตรอัตโนมัติอยู่แล้ว เปลี่ยนวิธีที่ปุ่มจัดการบัตร) */
  methodLocked: boolean;
  stateOf: (plan: PricingPlan) => PlanCardState;
  busyPlan: PlanId | null;
  onChoose: (plan: PricingPlan) => void;
}

/** เลือกรอบบิลและแพ็กเกจ หน้าตาเดียวกับหน้าราคา แต่แต่ละการ์ดมีปุ่มของตัวเอง */
export function PlanCards({ billing, onBillingChange, method, onMethodChange, methodLocked, stateOf, busyPlan, onChoose }: PlanCardsProps) {
  const yearly = billing === "yearly";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3">
        <div role="radiogroup" aria-label="รอบการชำระเงิน" className="border-border bg-surface relative grid grid-cols-2 rounded-full border p-1">
          <span
            aria-hidden
            className={cn(
              "bg-primary absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
              yearly && "translate-x-full",
            )}
          />
          {CYCLES.map((cycle) => (
            <button
              key={cycle.value}
              type="button"
              role="radio"
              aria-checked={billing === cycle.value}
              onClick={() => onBillingChange(cycle.value)}
              className={cn(
                "focus-visible:ring-primary/50 relative z-10 flex h-10 min-w-[116px] cursor-pointer items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors duration-300 focus-visible:ring-2 focus-visible:outline-none",
                billing === cycle.value ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {cycle.label}
            </button>
          ))}
        </div>
        <p className={cn("text-success-strong text-center text-[13px] font-semibold transition-opacity", !yearly && "opacity-60")}>
          รายปีจ่ายแค่ {12 - YEARLY_FREE_MONTHS} เดือน ใช้ครบ 12 เดือน
        </p>
      </div>

      <fieldset disabled={methodLocked} className="mx-auto flex w-full max-w-[720px] flex-col gap-2.5">
        <legend className="text-foreground mb-1 text-sm font-semibold">วิธีชำระเงิน</legend>
        <div role="radiogroup" aria-label="วิธีชำระเงิน" className="grid gap-3 sm:grid-cols-2">
          {METHODS.map((item) => {
            const selected = method === item.value;
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onMethodChange(item.value)}
                className={cn(
                  "focus-visible:ring-primary/50 flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed",
                  selected ? "border-primary bg-primary-soft border-2" : "border-border bg-surface hover:border-primary/50",
                  methodLocked && "opacity-60",
                )}
              >
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-foreground text-sm font-semibold">{item.title}</span>
                  <span className="text-muted-foreground text-xs">{item.description(billing)}</span>
                </span>
              </button>
            );
          })}
        </div>
        {methodLocked && (
          <p className="text-muted-foreground text-xs">คุณสมัครแบบตัดบัตรอัตโนมัติอยู่ เปลี่ยนบัตรหรือวิธีชำระได้ที่ปุ่ม “จัดการบัตรและใบแจ้งหนี้”</p>
        )}
      </fieldset>

      <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {PRICING_PLANS.map((item) => {
          const state = stateOf(item);
          return (
            <li
              key={item.id}
              className={cn(
                "bg-surface relative flex flex-col gap-5 rounded-xl p-6",
                state.current || state.trial ? "border-primary border-2" : "border-border border",
              )}
            >
              {(state.current || state.trial || item.featured) && (
                <span
                  className={cn(
                    "absolute -top-3 left-6 rounded-full px-3 py-1 text-xs leading-none font-semibold",
                    state.current || state.trial ? "bg-success text-white" : "bg-primary text-primary-foreground",
                  )}
                >
                  {state.current ? "แพ็กเกจปัจจุบัน" : state.trial ? "กำลังทดลองใช้" : "แนะนำ"}
                </span>
              )}
              <div className="flex flex-col gap-1">
                <h3 className="font-display text-foreground text-[23px] font-semibold">{item.name}</h3>
                <p className="text-muted-foreground text-[13px]">{item.description}</p>
              </div>

              <div className="flex min-h-[96px] flex-col gap-1" aria-live="polite">
                <p className="flex items-baseline gap-2">
                  <span className="font-display text-foreground text-[40px] leading-none font-semibold">
                    {formatPrice(yearly ? yearlyPerMonth(item) : item.monthly)}
                  </span>
                  <span className="text-muted-foreground text-sm">ต่อเดือน</span>
                  {yearly && <span className="text-muted-foreground text-sm line-through">{formatPrice(item.monthly)}</span>}
                </p>
                {yearly ? (
                  <>
                    <p className="text-foreground text-[13px] font-medium">ชำระปีละ {formatPrice(item.yearly)}</p>
                    <p className="text-success-strong text-[13px] font-semibold">ประหยัด {formatPrice(yearlySavings(item))} ต่อปี</p>
                  </>
                ) : (
                  <p className="text-muted-foreground text-[13px]">ยกเลิกได้ทุกเมื่อ ไม่มีสัญญาผูกมัด</p>
                )}
                <p className="text-muted-foreground text-xs">ยังไม่รวมภาษีมูลค่าเพิ่ม</p>
              </div>

              <ul className="border-border flex flex-col gap-3 border-t pt-4">
                {item.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5 text-[13px]">
                    <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
                    {perk}
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex flex-col gap-2 pt-1">
                <Button
                  variant={state.disabled ? "outline" : item.featured || state.trial || state.current ? "primary" : "outline"}
                  disabled={Boolean(state.disabled) || Boolean(state.blockedReason) || busyPlan !== null}
                  loading={busyPlan === item.id}
                  onClick={() => onChoose(item)}
                >
                  {state.cta}
                </Button>
                {state.blockedReason && <p className="text-danger-strong text-center text-xs">{state.blockedReason}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
