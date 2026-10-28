import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Metric, Tone } from "@/features/dashboard/types";

const ICON_TONE: Record<Tone, string> = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

/** ตัวชี้วัดหนึ่งรายการ: ชื่อ + ไอคอน ค่าตัวเลขใหญ่ และหมายเหตุเทียบเมื่อวาน */
export function MetricCard({ metric }: { metric: Metric }) {
  const { label, value, note, icon: Icon, tone } = metric;

  return (
    <Card className="flex flex-col gap-2.5 p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-[13px]">{label}</p>
        <Icon className={cn("size-[18px]", ICON_TONE[tone])} aria-hidden />
      </div>
      <p className="font-display text-foreground text-[30px] leading-[1.4] font-semibold">
        {value}
      </p>
      <p className="text-muted-foreground text-[11px]">{note}</p>
    </Card>
  );
}
