import { CircleCheck } from "lucide-react";
import { formatNumber } from "@/features/dashboard/lib/format";
import { cn } from "@/lib/cn";
import { billTotal, dishCount, unservedCount } from "../lib/bill-utils";
import type { CheckoutConfig, TableBill } from "../types";

interface TableTileProps {
  bill: TableBill;
  config: Pick<CheckoutConfig, "serviceChargePercent">;
  selected: boolean;
  onSelect: (bill: TableBill) => void;
}

/**
 * ช่องโต๊ะหนึ่งช่อง: แถบสีด้านซ้ายบอกสถานะ (เหลือง = รอชำระ, เขียว = ชำระแล้ว)
 * ตัวเลขยอดใหญ่ชัดเพื่อกวาดตามองหาโต๊ะได้เร็ว ช่องที่เลือกอยู่ถูกล้อมด้วยกรอบสีน้ำเงิน
 */
export function TableTile({
  bill,
  config,
  selected,
  onSelect,
}: TableTileProps) {
  const paid = bill.payment;
  const pending = unservedCount(bill);

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(bill)}
      className={cn(
        "focus-visible:ring-primary/50 relative flex min-h-[112px] w-full cursor-pointer flex-col justify-between gap-3 overflow-hidden rounded-xl border py-3.5 pr-4 pl-5 text-left transition-[background-color,border-color,box-shadow] focus-visible:ring-2 focus-visible:outline-none",
        selected
          ? "border-primary bg-primary-soft ring-primary shadow-card ring-2"
          : "border-border bg-surface hover:border-primary/50 hover:bg-muted",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-1.5",
          paid ? "bg-success" : "bg-warning",
        )}
      />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-foreground truncate text-lg leading-tight font-semibold">
            {bill.tableName}
          </p>
          <p className="text-muted-foreground truncate text-xs">{bill.zone}</p>
        </div>
        {paid ? (
          <span className="text-success-strong flex shrink-0 items-center gap-1 text-xs font-semibold">
            <CircleCheck className="size-4" aria-hidden />
            ชำระแล้ว
          </span>
        ) : (
          <span className="text-warning-strong shrink-0 text-xs font-semibold">
            รอชำระ
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        <p className="font-display text-foreground text-[26px] leading-none font-semibold tabular-nums">
          ฿{formatNumber(billTotal(bill, config))}
        </p>
        <p className="text-muted-foreground text-right text-[11px] leading-snug">
          {dishCount(bill.rounds)} จาน • {bill.openedAt} น.
          {!paid && pending > 0 && (
            <span className="text-warning-strong block">ครัวยังทำอยู่</span>
          )}
        </p>
      </div>
    </button>
  );
}
