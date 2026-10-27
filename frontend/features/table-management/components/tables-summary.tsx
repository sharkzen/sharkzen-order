import type { ReactNode } from "react";
import { DoorClosed, DoorOpen, QrCode } from "lucide-react";
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
          {value} โต๊ะ
        </span>
      </div>
    </Card>
  );
}

interface TablesSummaryProps {
  total: number;
  open: number;
  closed: number;
}

/** สรุปจำนวนโต๊ะ: ทั้งหมด / เปิดอยู่ / ว่าง (อัปเดตทันทีเมื่อเปิด-ปิดโต๊ะ) */
export function TablesSummary({ total, open, closed }: TablesSummaryProps) {
  return (
    <section
      aria-label="สรุปโต๊ะ"
      className="grid gap-3 sm:grid-cols-3 sm:gap-4"
    >
      <SummaryCard
        label="โต๊ะทั้งหมด"
        value={total}
        iconClassName="bg-primary-soft text-primary"
        icon={<QrCode className="size-[21px]" aria-hidden />}
      />
      <SummaryCard
        label="เปิดอยู่"
        value={open}
        iconClassName="bg-success-soft text-success"
        icon={<DoorOpen className="size-[21px]" aria-hidden />}
      />
      <SummaryCard
        label="ว่าง"
        value={closed}
        iconClassName="bg-muted text-muted-foreground"
        icon={<DoorClosed className="size-[21px]" aria-hidden />}
      />
    </section>
  );
}
