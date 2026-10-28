import { CircleCheck, Hourglass, Wallet, type LucideIcon } from "lucide-react";
import { formatNumber } from "@/features/dashboard/lib/format";
import { cn } from "@/lib/cn";

interface CashierStatsProps {
  dueTables: number;
  dueAmount: number;
  collectedToday: number;
}

/** ตัวเลขสรุปเหนือรายการโต๊ะ: รอชำระกี่โต๊ะ ต้องเก็บเท่าไร และเก็บได้แล้วเท่าไรวันนี้ */
export function CashierStats({ dueTables, dueAmount, collectedToday }: CashierStatsProps) {
  const items: { label: string; value: string; unit: string; icon: LucideIcon; tone: string }[] = [
    { label: "รอชำระ", value: formatNumber(dueTables), unit: "โต๊ะ", icon: Hourglass, tone: "bg-warning-soft text-warning-strong" },
    { label: "ยอดรอเก็บ", value: `฿${formatNumber(dueAmount)}`, unit: "", icon: Wallet, tone: "bg-primary-soft text-primary-strong" },
    { label: "เก็บแล้ววันนี้", value: `฿${formatNumber(collectedToday)}`, unit: "", icon: CircleCheck, tone: "bg-success-soft text-success-strong" },
  ];

  return (
    <dl className="grid grid-cols-3 gap-2 lg:min-w-[560px] lg:gap-3">
      {items.map(({ label, value, unit, icon: Icon, tone }) => (
        <div key={label} className="border-border bg-surface flex items-center gap-2.5 rounded-xl border px-3 py-2 sm:px-3.5">
          <span aria-hidden className={cn("hidden size-9 shrink-0 items-center justify-center rounded-lg sm:flex", tone)}>
            <Icon className="size-[18px]" />
          </span>
          <div className="flex min-w-0 flex-col">
            <dt className="text-muted-foreground text-xs">{label}</dt>
            <dd className="flex items-baseline gap-1.5">
              <span className="font-display text-foreground text-lg leading-tight font-semibold tabular-nums sm:text-xl">
                {value}
              </span>
              {unit && <span className="text-muted-foreground text-xs">{unit}</span>}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
