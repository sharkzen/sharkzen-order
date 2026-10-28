"use client";

import type { ReactNode } from "react";
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
  /** ปุ่มยืนยัน แสดงใต้การ์ดแพ็กเกจ */
  footer?: ReactNode;
}

const CYCLES: { value: BillingCycle; label: string }[] = [
  { value: "monthly", label: "รายเดือน" },
  { value: "yearly", label: "รายปี" },
];

/** เลือกแพ็กเกจและรอบชำระเงิน หน้าตาเดียวกับส่วนราคาในหน้าแรก */
export function PlanPicker({
  plan,
  billing,
  onPlanChange,
  onBillingChange,
  footer,
}: PlanPickerProps) {
  const yearly = billing === "yearly";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-3">
        <div
          role="radiogroup"
          aria-label="รอบการชำระเงิน"
          className="border-border bg-surface relative grid grid-cols-2 rounded-full border p-1"
        >
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
                billing === cycle.value
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {cycle.label}
            </button>
          ))}
        </div>
        <p
          className={cn(
            "text-success-strong text-center text-[13px] font-semibold transition-opacity",
            !yearly && "opacity-60",
          )}
        >
          รายปีจ่ายแค่ {12 - YEARLY_FREE_MONTHS} เดือน ใช้ครบ 12 เดือน ประหยัดกว่า{" "}
          {Math.round((YEARLY_FREE_MONTHS / 12) * 100)}%
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="แพ็กเกจ"
        className="mx-auto grid w-full max-w-[1100px] gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6"
      >
        {PRICING_PLANS.map((item) => {
          const selected = item.id === plan.id;
          return (
            <div
              key={item.id}
              role="radio"
              aria-checked={selected}
              tabIndex={0}
              onClick={() => onPlanChange(item.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onPlanChange(item.id);
                }
              }}
              className={cn(
                "bg-surface focus-visible:ring-primary/50 relative flex cursor-pointer flex-col gap-[22px] rounded-xl p-6 transition-colors focus-visible:ring-2 focus-visible:outline-none sm:p-7",
                selected
                  ? "border-primary border-2"
                  : "border-border hover:border-primary/50 border",
              )}
            >
              {item.featured && (
                <span className="bg-primary text-primary-foreground absolute -top-3 left-6 rounded-full px-3 py-1 text-xs leading-none font-semibold sm:left-7">
                  แนะนำ
                </span>
              )}
              <div className="flex items-center justify-between">
                <h3 className="font-display text-foreground text-[23px] font-semibold">
                  {item.name}
                </h3>
                {selected && (
                  <span className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full">
                    <Check className="size-4" aria-hidden />
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-[13px]">{item.description}</p>
              <div className="flex min-h-[104px] flex-col gap-1" aria-live="polite">
                <p className="flex items-baseline gap-2">
                  <span className="font-display text-foreground text-[44px] font-semibold">
                    {formatBaht(yearly ? yearlyPerMonth(item) : item.monthly)}
                  </span>
                  <span className="text-muted-foreground text-sm">บาทต่อเดือน</span>
                  {yearly && (
                    <span className="text-muted-foreground text-sm line-through">
                      {formatBaht(item.monthly)}
                    </span>
                  )}
                </p>
                {yearly ? (
                  <>
                    <p className="text-foreground text-[13px] font-medium">
                      ชำระปีละ {formatBaht(item.yearly)} บาท
                    </p>
                    <p className="text-success-strong text-[13px] font-semibold">
                      ประหยัด {formatBaht(yearlySavings(item))} บาทต่อปี
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground text-[13px]">
                    ยกเลิกได้ทุกเดือน ไม่มีสัญญาผูกมัด
                  </p>
                )}
                <p className="text-muted-foreground text-xs">ยังไม่รวมภาษีมูลค่าเพิ่ม</p>
              </div>
              <ul className="border-border flex flex-col gap-[14px] border-t pt-5">
                {item.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-[10px] text-sm">
                    <Check className="text-success size-[17px] shrink-0" aria-hidden />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mx-auto flex w-full max-w-[420px] flex-col gap-3">
        <p className="text-muted-foreground text-center text-[13px]">
          ทดลองใช้ฟรี {TRIAL_DAYS} วัน จากนั้นเริ่มเก็บเงินตามแพ็กเกจ {plan.name}
        </p>
        {footer}
      </div>
    </div>
  );
}
