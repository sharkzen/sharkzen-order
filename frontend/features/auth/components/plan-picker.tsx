"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  PRICING_PLANS,
  TRIAL_DAYS,
  YEARLY_FREE_MONTHS,
  formatBaht,
  yearlyPerMonth,
  yearlySavings,
  type BillingCycle,
  type PlanId,
  type PricingPlan,
} from "@/features/landing/data";

interface PlanPickerProps {
  plan: PricingPlan;
  billing: BillingCycle;
  onPlanChange: (id: PlanId) => void;
  onBillingChange: (billing: BillingCycle) => void;
}

const CYCLES: { value: BillingCycle; label: string }[] = [
  { value: "monthly", label: "รายเดือน" },
  { value: "yearly", label: "รายปี" },
];

/** เลือกแพ็กเกจและรอบชำระเงิน พร้อมสรุปราคาที่จะเริ่มเก็บหลังทดลองใช้ฟรี */
export function PlanPicker({
  plan,
  billing,
  onPlanChange,
  onBillingChange,
}: PlanPickerProps) {
  const yearly = billing === "yearly";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-2">
        <div
          role="radiogroup"
          aria-label="รอบการชำระเงิน"
          className="border-border bg-surface flex rounded-full border p-1"
        >
          {CYCLES.map((cycle) => (
            <button
              key={cycle.value}
              type="button"
              role="radio"
              aria-checked={billing === cycle.value}
              onClick={() => onBillingChange(cycle.value)}
              className={cn(
                "focus-visible:ring-primary/50 h-10 min-w-[110px] cursor-pointer rounded-full px-5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
                billing === cycle.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {cycle.label}
            </button>
          ))}
        </div>
        <p className="text-success-strong text-[13px] font-semibold">
          รายปีแถมฟรี {YEARLY_FREE_MONTHS} เดือน
        </p>
      </div>

      <div role="radiogroup" aria-label="แพ็กเกจ" className="grid gap-3 sm:grid-cols-3">
        {PRICING_PLANS.map((item) => {
          const selected = item.id === plan.id;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onPlanChange(item.id)}
              className={cn(
                "bg-surface focus-visible:ring-primary/50 flex cursor-pointer flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none",
                selected
                  ? "border-primary ring-primary ring-1"
                  : "border-border hover:border-primary/50",
              )}
            >
              <span className="flex w-full items-center justify-between text-sm font-semibold">
                {item.name}
                {selected && <Check className="text-primary size-4" aria-hidden />}
              </span>
              <span className="text-primary-strong text-xl font-bold">
                {formatBaht(yearly ? yearlyPerMonth(item) : item.monthly)}
                <span className="text-muted-foreground text-xs font-normal"> /เดือน</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="border-border bg-muted flex flex-col gap-3 rounded-xl border p-4">
        <ul className="flex flex-col gap-2">
          {plan.perks.map((perk) => (
            <li key={perk} className="flex items-center gap-2 text-sm">
              <Check className="text-success size-4 shrink-0" aria-hidden />
              {perk}
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground border-border border-t pt-3 text-[13px] leading-relaxed" aria-live="polite">
          ทดลองใช้ฟรี {TRIAL_DAYS} วัน จากนั้น{" "}
          <strong className="text-foreground">
            {yearly
              ? `${formatBaht(plan.yearly)} บาท/ปี`
              : `${formatBaht(plan.monthly)} บาท/เดือน`}
          </strong>
          {yearly
            ? ` (ประหยัด ${formatBaht(yearlySavings(plan))} บาท)`
            : " ยกเลิกได้ทุกเดือน"}{" "}
          ยังไม่รวมภาษีมูลค่าเพิ่ม
        </p>
      </div>
    </div>
  );
}
