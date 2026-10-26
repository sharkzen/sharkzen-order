import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { formatNumber } from "../../lib/format";
import type { RevenueSummary } from "../../types";
import { SectionCard } from "../shared/section-card";
import { RevenueBar } from "./revenue-bar";

/** รายได้วันนี้ แยกเป็นแท่งทุก 30 นาที ไฮไลต์ช่วงที่ขายดีที่สุด */
export function RevenueChartCard({ revenue }: { revenue: RevenueSummary }) {
  const { total, changePercent, axisMax, bars, timeLabels, updatedAt } =
    revenue;
  const peak = Math.max(...bars.map((bar) => bar.amount));
  const ticks = [axisMax, axisMax / 2, 0];

  return (
    <SectionCard
      title="รายได้วันนี้"
      action={{ label: "ดูรายงาน →", href: ROUTES.reports }}
      className="min-w-0"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-baseline gap-2">
            <span className="font-display text-foreground text-[30px] leading-[1.4] font-semibold">
              {formatNumber(total)}
            </span>
            <span className="text-muted-foreground text-xs">บาท</span>
          </p>
          <Badge tone="success">
            <TrendingUp className="size-[13px]" aria-hidden />
            เพิ่มขึ้น {changePercent}%
          </Badge>
        </div>

        <div className="flex h-44 items-stretch gap-3">
          <div
            aria-hidden
            className="text-muted-foreground flex w-9 flex-col justify-between text-[10px]"
          >
            {ticks.map((tick) => (
              <span key={tick}>{formatNumber(tick)}</span>
            ))}
          </div>
          <div
            role="img"
            aria-label={`กราฟรายได้ทุก 30 นาที สูงสุด ${formatNumber(peak)} บาท`}
            className="border-border flex flex-1 items-end gap-[9px] border-b sm:gap-[13px]"
          >
            {bars.map((bar, index) => (
              <RevenueBar
                key={bar.time}
                delay={index * 0.04}
                heightPercent={(bar.amount / axisMax) * 100}
                highlight={bar.amount === peak}
              />
            ))}
          </div>
        </div>

        <div
          aria-hidden
          className="text-muted-foreground flex justify-between pl-12 text-[10px]"
        >
          {timeLabels.map((time) => (
            <span key={time}>{time}</span>
          ))}
        </div>
        <p className="text-muted-foreground text-[11px]">
          รายได้ทุก 30 นาที • อัปเดต {updatedAt}
        </p>
      </div>
    </SectionCard>
  );
}
