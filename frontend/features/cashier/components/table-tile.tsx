import { CircleCheck, CookingPot, Hourglass, Moon } from "lucide-react";
import { formatNumber } from "@/features/dashboard/lib/format";
import { cn } from "@/lib/cn";
import { billTotal, isEmptyTable, mergeLines, unservedCount } from "@/features/cashier/lib/bill-utils";
import type { CheckoutConfig, TableBill } from "@/features/cashier/types";
import { ElapsedTime } from "@/features/table-management/components/elapsed-time";

interface TableTileProps {
  bill: TableBill;
  config: Pick<CheckoutConfig, "serviceChargePercent">;
  selected: boolean;
  onSelect: (bill: TableBill) => void;
}

const PREVIEW_LINES = 2;

/**
 * ช่องโต๊ะหนึ่งช่อง อ่านได้ในแวบเดียว: ชื่อโต๊ะ + สถานะ, อาหารที่สั่ง, ยอดใหญ่ และเวลาที่นั่งมาแล้ว
 * แถบสีซ้าย: เหลือง = รอชำระ, เขียว = ชำระแล้ว, เทา = เปิดโต๊ะแต่ยังไม่มีใครสั่ง
 */
export function TableTile({ bill, config, selected, onSelect }: TableTileProps) {
  const paid = bill.payment;
  const empty = isEmptyTable(bill);
  const pending = unservedCount(bill);
  const lines = mergeLines(bill.rounds);
  const extra = Math.max(0, lines.length - PREVIEW_LINES);

  const status = paid
    ? { label: "ชำระแล้ว", icon: CircleCheck, tone: "text-success-strong bg-success-soft", bar: "bg-success" }
    : empty
      ? { label: "ยังไม่สั่ง", icon: Moon, tone: "text-muted-foreground bg-muted", bar: "bg-border" }
      : { label: "รอชำระ", icon: Hourglass, tone: "text-warning-strong bg-warning-soft", bar: "bg-warning" };
  const StatusIcon = status.icon;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(bill)}
      className={cn(
        "focus-visible:ring-primary/50 relative flex min-h-[148px] w-full cursor-pointer flex-col gap-3 overflow-hidden rounded-xl border py-3.5 pr-4 pl-5 text-left transition-[background-color,border-color,box-shadow] focus-visible:ring-2 focus-visible:outline-none",
        selected
          ? "border-primary bg-primary-soft ring-primary shadow-card ring-2"
          : "border-border bg-surface hover:border-primary/50 hover:bg-muted",
        empty && !selected && "opacity-80",
      )}
    >
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1.5", status.bar)} />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-foreground truncate text-lg leading-tight font-semibold">{bill.tableName}</p>
          <p className="text-muted-foreground truncate text-xs">{bill.zone}</p>
        </div>
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
            status.tone,
          )}
        >
          <StatusIcon className="size-3.5" aria-hidden />
          {status.label}
        </span>
      </div>

      <div className="text-muted-foreground min-h-[34px] text-xs leading-snug">
        {empty ? (
          "เปิดโต๊ะแล้ว รอลูกค้าสั่งอาหาร"
        ) : (
          <>
            {lines.slice(0, PREVIEW_LINES).map((line) => (
              <p key={`${line.name}|${line.unitPrice}`} className="truncate">
                {line.quantity}× {line.name}
              </p>
            ))}
            {extra > 0 && <p>และอีก {extra} รายการ</p>}
          </>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between gap-2">
        <p className="font-display text-foreground text-[28px] leading-none font-semibold tabular-nums">
          {empty ? "—" : `฿${formatNumber(billTotal(bill, config))}`}
        </p>
        <div className="text-muted-foreground flex flex-col items-end gap-0.5 text-[11px] leading-snug">
          {!paid && pending > 0 && (
            <span className="text-warning-strong flex items-center gap-1 font-medium">
              <CookingPot className="size-3.5" aria-hidden />
              ครัวกำลังทำ
            </span>
          )}
          <span>
            นั่งมา <ElapsedTime openedAt={bill.openedAtMs} />
          </span>
        </div>
      </div>
    </button>
  );
}
