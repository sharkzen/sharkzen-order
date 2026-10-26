import { CalendarDays } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  dateLabel: string;
}

/** หัวข้อหน้า + ช่องเลือกวันที่ของรายงาน */
export function PageHeader({ title, description, dateLabel }: PageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-foreground text-[28px] leading-tight font-semibold">
          {title}
        </h1>
        <p className="text-muted-foreground text-[13px]">{description}</p>
      </div>
      <button
        type="button"
        aria-label={`เลือกวันที่ ปัจจุบัน ${dateLabel}`}
        className="border-border bg-surface hover:bg-muted focus-visible:ring-primary/50 flex h-[46px] w-full cursor-pointer items-center justify-between gap-3 rounded-lg border px-3.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none sm:w-[204px]"
      >
        <span className="text-muted-foreground">{dateLabel}</span>
        <CalendarDays className="text-muted-foreground size-4" aria-hidden />
      </button>
    </div>
  );
}
