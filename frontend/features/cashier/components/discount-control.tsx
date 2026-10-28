"use client";

import { Input } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  NO_DISCOUNT,
  PERCENT_PRESETS,
  type DiscountInput,
} from "@/features/cashier/lib/bill-utils";

interface DiscountControlProps {
  value: DiscountInput;
  onChange: (value: DiscountInput) => void;
}

const CHIP =
  "focus-visible:ring-primary/50 h-9 min-w-11 cursor-pointer rounded-lg border px-3 text-[13px] font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none";

/** ส่วนลดแบบกดทีเดียว: ไม่มี / 5% / 10% / 20% หรือกรอกเป็นบาทเอง */
export function DiscountControl({ value, onChange }: DiscountControlProps) {
  return (
    <div className="flex flex-col gap-2 py-1">
      <div className="flex items-center justify-between gap-3">
        <span id="discount-label" className="text-muted-foreground">
          ส่วนลด
        </span>
        <div
          role="group"
          aria-labelledby="discount-label"
          className="flex flex-wrap justify-end gap-1.5"
        >
          <Chip
            active={value.mode === "none"}
            onClick={() => onChange(NO_DISCOUNT)}
          >
            ไม่มี
          </Chip>
          {PERCENT_PRESETS.map((percent) => (
            <Chip
              key={percent}
              active={value.mode === "percent" && value.value === percent}
              onClick={() => onChange({ mode: "percent", value: percent })}
            >
              {percent}%
            </Chip>
          ))}
          <Chip
            active={value.mode === "baht"}
            onClick={() =>
              onChange({
                mode: "baht",
                value: value.mode === "baht" ? value.value : 0,
              })
            }
          >
            ฿
          </Chip>
        </div>
      </div>
      {value.mode === "baht" && (
        <div className="flex items-center justify-end gap-2">
          <label
            htmlFor="discount-baht"
            className="text-muted-foreground text-xs"
          >
            ลดเป็นจำนวนเงิน (บาท)
          </label>
          <Input
            id="discount-baht"
            type="number"
            inputMode="numeric"
            min={0}
            value={value.value === 0 ? "" : value.value}
            placeholder="0"
            onChange={(e) =>
              onChange({ mode: "baht", value: Number(e.target.value) || 0 })
            }
            className="h-9 w-28 text-right"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        CHIP,
        active
          ? "border-primary bg-primary-soft text-primary-strong"
          : "border-border bg-surface text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
