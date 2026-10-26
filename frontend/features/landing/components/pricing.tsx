import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { Badge, buttonVariants } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/cn";
import { PRICING_PLANS } from "../data";

export function Pricing() {
  return (
    <Section id="pricing" tone="muted" innerClassName="flex flex-col gap-9">
      <SectionHeading
        title="ราคาโปร่งใส เติบโตไปด้วยกัน"
        description="ชำระรายเดือน • ไม่มีค่าธรรมเนียมต่อออร์เดอร์ • ทุกแพ็กเกจทดลองใช้ฟรี 14 วัน"
        className="gap-2.5"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {PRICING_PLANS.map((plan) => (
          <article
            key={plan.name}
            className={cn(
              "bg-surface flex flex-col gap-[22px] rounded-xl p-7",
              plan.featured
                ? "border-primary border-2"
                : "border-border border",
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-foreground text-[23px] font-semibold">
                {plan.name}
              </h3>
              {plan.featured && (
                <Badge tone="info">
                  <Sparkles className="size-[13px]" aria-hidden />
                  แนะนำ
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-[13px]">
              {plan.description}
            </p>
            <div className="flex flex-col">
              <p className="flex items-baseline gap-2">
                <span className="font-display text-foreground text-[44px] font-semibold">
                  {plan.price}
                </span>
                <span className="text-muted-foreground text-sm">
                  บาทต่อเดือน
                </span>
              </p>
              <p className="text-muted-foreground text-xs">
                ยังไม่รวมภาษีมูลค่าเพิ่ม
              </p>
            </div>
            <Link
              href={ROUTES.register}
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
