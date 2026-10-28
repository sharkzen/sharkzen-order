import { TrendingUp } from "lucide-react";
import { AnimatedBar } from "@/components/motion/animated-bar";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  DAILY_REVENUE,
  REVENUE_BARS,
  REVENUE_PEAK_INDEX,
  REVENUE_TIME_LABELS,
} from "@/features/landing/data";

export function RevenueChart() {
  return (
    <div className="bg-surface flex min-w-0 flex-col gap-3 rounded-xl p-[18px]">
      <p className="text-foreground text-sm font-semibold">รายได้วันนี้</p>
      <div className="flex items-center justify-between">
        <p className="flex items-baseline gap-2">
          <span className="font-display text-foreground text-2xl font-semibold">
            {DAILY_REVENUE.toLocaleString("th-TH")}
          </span>
          <span className="text-muted-foreground text-xs">บาท</span>
        </p>
        <Badge tone="success">
          <TrendingUp className="size-[13px]" aria-hidden />
          เพิ่มขึ้น 12.8%
        </Badge>
      </div>

      <div className="flex h-[130px] items-end gap-3">
        <div className="text-muted-foreground flex h-full w-9 flex-col justify-between text-[10px]">
          <span>2,000</span>
          <span>1,000</span>
          <span>0</span>
        </div>
        <div className="border-border flex h-full flex-1 items-end gap-[9px] border-b">
          {REVENUE_BARS.map((height, index) => (
            <AnimatedBar
              key={index}
              delay={index * 0.04}
              style={{ height }}
              className={cn(
                "flex-1 rounded-t-[4px]",
                index === REVENUE_PEAK_INDEX
                  ? "bg-primary"
                  : "bg-primary-muted",
              )}
            />
          ))}
        </div>
      </div>
      <div className="text-muted-foreground flex justify-between pl-12 text-[10px]">
        {REVENUE_TIME_LABELS.map((time) => (
          <span key={time}>{time}</span>
        ))}
      </div>
    </div>
  );
}
