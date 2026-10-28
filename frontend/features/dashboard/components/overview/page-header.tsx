import { CalendarDays } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  /** ช่วงวันที่ที่กำลังดูอยู่ */
  dateLabel: string;
}

/** หัวข้อหน้า + ป้ายช่วงวันที่ที่เลือก (ตัวเลือกอยู่ที่แถบตัวกรองด้านล่าง) */
export function PageHeader({ title, description, dateLabel }: PageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-foreground text-[28px] leading-tight font-semibold">
          {title}
        </h1>
        <p className="text-muted-foreground text-[13px]">{description}</p>
      </div>
      <p
        aria-label={`ช่วงเวลาที่แสดง ${dateLabel}`}
        className="border-border bg-surface text-foreground flex h-[46px] w-fit items-center gap-2.5 rounded-lg border px-3.5 text-sm"
      >
        <CalendarDays className="text-muted-foreground size-4" aria-hidden />
        {dateLabel}
      </p>
    </div>
  );
}
