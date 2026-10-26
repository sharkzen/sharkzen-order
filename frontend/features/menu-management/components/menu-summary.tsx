import type { ReactNode } from "react";
import { CircleCheck, CirclePause, Utensils } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";

interface SummaryCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  iconClassName: string;
}

function SummaryCard({ icon, label, value, iconClassName }: SummaryCardProps) {
  return (
    <Card className="flex items-center gap-3.5 p-[18px]">
      <span
        className={cn(
          "flex size-[42px] shrink-0 items-center justify-center rounded-xl",
          iconClassName,
        )}
      >
        {icon}
      </span>
      <div className="flex flex-col leading-[1.6]">
        <span className="text-muted-foreground text-xs">{label}</span>
        <span className="font-display text-foreground text-[22px] font-semibold">
          {value} เมนู
        </span>
      </div>
    </Card>
  );
}

interface MenuSummaryProps {
  total: number;
  available: number;
  soldout: number;
}

/** สรุปจำนวนเมนู: ทั้งหมด / พร้อมขาย / หมดชั่วคราว (อัปเดตทันทีเมื่อสลับสถานะ) */
export function MenuSummary({ total, available, soldout }: MenuSummaryProps) {
  return (
    <section
      aria-label="สรุปเมนู"
      className="grid gap-3 sm:grid-cols-3 sm:gap-4"
    >
      <SummaryCard
        label="เมนูทั้งหมด"
        value={total}
        iconClassName="bg-primary-soft text-primary"
        icon={<Utensils className="size-[21px]" aria-hidden />}
      />
      <SummaryCard
        label="พร้อมขาย"
        value={available}
        iconClassName="bg-success-soft text-success"
        icon={<CircleCheck className="size-[21px]" aria-hidden />}
      />
      <SummaryCard
        label="หมดชั่วคราว"
        value={soldout}
        iconClassName="bg-warning-soft text-warning"
        icon={<CirclePause className="size-[21px]" aria-hidden />}
      />
    </section>
  );
}
