import { CalendarDays } from "lucide-react";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { FadeIn } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui";
import { DASHBOARD_METRICS } from "@/features/landing/data";
import { DashboardSidebar } from "./dashboard-sidebar";
import { PaymentSummary } from "./payment-summary";
import { RevenueChart } from "./revenue-chart";
import { TodayLabel } from "./today-label";

/** ภาพจำลองหน้าจอจัดการร้าน (ข้อมูลตัวอย่างเพื่อการนำเสนอ) */
export function ProductPreview() {
  return (
    <Section
      id="preview"
      tone="muted"
      className="py-[72px]"
      innerClassName="flex flex-col gap-8"
    >
      <SectionHeading
        title="หน้าร้าน หลังครัว และบัญชี อยู่ในหน้าจอเดียว"
        description="ยอดขาย คำสั่งซื้อ โต๊ะ และการชำระเงิน ที่ทีมของคุณเปิดดูได้ทุกเมื่อ"
        className="mx-auto max-w-[760px]"
      />

      <FadeIn>
        <div
          className="border-border bg-surface shadow-float overflow-hidden rounded-xl border"
          aria-label="ตัวอย่างหน้าจอภาพรวมร้านอาหาร (ข้อมูลตัวอย่าง)"
        >
          <div className="bg-background flex">
            <DashboardSidebar />
            <div className="flex min-w-0 flex-1 flex-col gap-[18px] p-4 sm:p-[22px]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-display text-foreground text-lg font-semibold sm:text-[22px]">
                    ภาพรวมร้านอาหาร
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    ข้อมูลตัวอย่างเพื่อการนำเสนอ
                  </p>
                </div>
                <Badge tone="info" className="hidden sm:inline-flex">
                  <CalendarDays className="size-[13px]" aria-hidden />
                  <TodayLabel />
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {DASHBOARD_METRICS.map((metric) => (
                  <div
                    key={metric.label}
                    className="border-border bg-surface flex flex-col gap-1 rounded-[12px] border p-[14px]"
                  >
                    <p className="text-muted-foreground text-[10px]">
                      {metric.label}
                    </p>
                    <p className="font-display text-foreground text-[23px] font-semibold">
                      {metric.value}
                    </p>
                    <p className="text-success-strong text-[9px]">
                      {metric.note}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-4 lg:flex-row">
                <div className="min-w-0 flex-1">
                  <RevenueChart />
                </div>
                <PaymentSummary />
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    </Section>
  );
}
