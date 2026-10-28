import { cn } from "@/lib/cn";
import { STATUS_TABS } from "@/features/order-management/lib/labels";
import type { StatusFilter } from "@/features/order-management/types";

interface StatusTabsProps {
  value: StatusFilter;
  counts: Record<StatusFilter, number>;
  onChange: (value: StatusFilter) => void;
}

/** แท็บกรองตามสถานะอาหาร พร้อมจำนวนในแต่ละสถานะ (เลื่อนแนวนอนได้บนจอเล็ก) */
export function StatusTabs({ value, counts, onChange }: StatusTabsProps) {
  return (
    <div
      role="group"
      aria-label="กรองตามสถานะคำสั่งซื้อ"
      className="scroll-thin border-border flex gap-2.5 overflow-x-auto border-b px-4 py-4 sm:px-5"
    >
      {STATUS_TABS.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "focus-visible:ring-primary/50 flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-md px-3.5 text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "rounded-[5px] px-1.5 py-px text-[11px] font-semibold",
                active ? "bg-white/20" : "bg-background",
              )}
            >
              {counts[tab.value]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
