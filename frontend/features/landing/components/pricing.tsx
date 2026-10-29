"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { buttonVariants } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/cn";
import {
  formatBaht,
  formatPrice,
  yearlyPerMonth,
  yearlySavings,
  type BillingCycle,
  type Catalog,
} from "@/features/landing/data";
import { useCatalog } from "@/features/pricing/lib/catalog";

const CYCLES: { value: BillingCycle; label: string }[] = [
  { value: "monthly", label: "รายเดือน" },
  { value: "yearly", label: "รายปี" },
];

export function Pricing({ catalog: initial }: { catalog: Catalog | null }) {
  const catalog = useCatalog(initial);
  const [billing, setBilling] = useState<BillingCycle>("yearly");
  const yearly = billing === "yearly";
  const plans = catalog?.plans ?? [];
  const freeMonths = catalog?.yearlyFreeMonths ?? 0;
  const cheapest = plans.length ? Math.min(...plans.map((plan) => plan.monthly)) : undefined;

  return (
    <Section id="pricing" tone="muted" innerClassName="flex flex-col gap-9">
      <SectionHeading
        title="ราคาโปร่งใส เติบโตไปด้วยกัน"
        description={`${cheapest ? `เริ่มต้นเพียงเดือนละ ${formatBaht(cheapest)} บาท • ` : ""}ไม่มีค่าธรรมเนียมต่อออร์เดอร์${catalog ? ` • ทุกแพ็กเกจทดลองใช้ฟรี ${catalog.trialDays} วัน` : ""}`}
        className="gap-2.5"
      />

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
              onClick={() => setBilling(cycle.value)}
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
            "text-success-strong text-[13px] font-semibold transition-opacity",
            !yearly && "opacity-60",
          )}
        >
          รายปีจ่ายแค่ {12 - freeMonths} เดือน ใช้ครบ 12 เดือน
          ประหยัดกว่า {Math.round((freeMonths / 12) * 100)}%
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.id}
            className={cn(
              "bg-surface relative flex flex-col gap-[22px] rounded-xl p-7",
              plan.featured
                ? "border-primary border-2"
                : "border-border border",
            )}
          >
            {plan.featured && (
              <span className="bg-primary text-primary-foreground absolute -top-3 left-7 rounded-full px-3 py-1 text-xs leading-none font-semibold">
                แนะนำ
              </span>
            )}
            <h3 className="font-display text-foreground text-[23px] font-semibold">
              {plan.name}
            </h3>
            <p className="text-muted-foreground text-[13px]">
              {plan.description}
            </p>
            <div className="flex min-h-[104px] flex-col gap-1" aria-live="polite">
              <p className="flex items-baseline gap-2">
                <span className="font-display text-foreground text-[44px] font-semibold">
                  {formatPrice(yearly ? yearlyPerMonth(plan) : plan.monthly)}
                </span>
                <span className="text-muted-foreground text-sm">
                  ต่อเดือน
                </span>
                {yearly && (
                  <span className="text-muted-foreground text-sm line-through">
                    {formatPrice(plan.monthly)}
                  </span>
                )}
              </p>
              {yearly ? (
                <>
                  <p className="text-foreground text-[13px] font-medium">
                    ชำระปีละ {formatPrice(plan.yearly)}
                  </p>
                  <p className="text-success-strong text-[13px] font-semibold">
                    ประหยัด {formatPrice(yearlySavings(plan))} ต่อปี
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground text-[13px]">
                  ยกเลิกได้ทุกเดือน ไม่มีสัญญาผูกมัด
                </p>
              )}
              <p className="text-muted-foreground text-xs">
                ยังไม่รวมภาษีมูลค่าเพิ่ม
              </p>
            </div>
            <Link
              href={`${ROUTES.register}?plan=${plan.id}&billing=${billing}`}
              className={buttonVariants({
                variant: plan.featured ? "primary" : "outline",
                className: "w-full",
              })}
            >
              {plan.cta}
            </Link>
            <ul className="flex flex-col gap-[14px] pt-[10px]">
              {plan.perks.map((perk) => (
                <li key={perk} className="flex items-center gap-[10px] text-sm">
                  <Check
                    className="text-success size-[17px] shrink-0"
                    aria-hidden
                  />
                  {perk}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <p className="text-muted-foreground text-center text-[13px]">
        มีมากกว่า 3 สาขา หรือต้องการรูปแบบเฉพาะ?
        ติดต่อทีมงานเพื่อรับคำแนะนำสำหรับธุรกิจของคุณ
      </p>
    </Section>
  );
}
