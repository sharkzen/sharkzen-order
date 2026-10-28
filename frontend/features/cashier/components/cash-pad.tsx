"use client";

import { useState, type FormEvent } from "react";
import { Delete } from "lucide-react";
import { Button } from "@/components/ui";
import { formatNumber } from "@/features/dashboard/lib/format";
import { cn } from "@/lib/cn";
import { cashShortcuts } from "@/features/cashier/lib/bill-utils";

interface CashPadProps {
  total: number;
  onConfirm: (received: number) => void;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "⌫"];
const MAX_DIGITS = 7;

/**
 * รับเงินสด: ซ้าย = ยอด เงินที่รับ ปุ่มลัด และเงินทอน / ขวา = ปุ่มตัวเลขใหญ่ + ปุ่มยืนยัน (จอเล็กเรียงต่อกัน)
 * ช่องแสดงยอดรับรองคีย์บอร์ดจริงด้วย (พิมพ์ตัวเลข / Backspace / Enter) สำหรับแคชเชียร์ที่ใช้คอมพิวเตอร์
 */
export function CashPad({ total, onConfirm }: CashPadProps) {
  const [digits, setDigits] = useState("");
  const received = Number(digits) || 0;
  const enough = received >= total;
  const change = received - total;

  function press(key: string) {
    if (key === "⌫") {
      setDigits((d) => d.slice(0, -1));
      return;
    }
    setDigits((d) => {
      const next = (d + key).replace(/^0+/, "");
      return next.length > MAX_DIGITS ? d : next;
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (enough) onConfirm(received);
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-xs">ยอดที่ต้องชำระ</p>
          <p className="font-display text-primary-strong text-[40px] leading-none font-semibold tabular-nums">
            ฿{formatNumber(total)}
          </p>
        </div>

        <div className="bg-muted flex flex-col gap-1 rounded-xl px-4 py-3">
          <label
            htmlFor="cash-received"
            className="text-muted-foreground text-xs"
          >
            รับเงินมา
          </label>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-muted-foreground text-2xl">
              ฿
            </span>
            {/* inputMode=none ไม่เรียกคีย์บอร์ดบนจอสัมผัส (ใช้ปุ่มตัวเลขแทน) แต่คีย์บอร์ดจริงยังพิมพ์ได้ */}
            <input
              id="cash-received"
              inputMode="none"
              autoComplete="off"
              autoFocus
              value={digits === "" ? "" : formatNumber(received)}
              placeholder="0"
              onChange={(e) =>
                setDigits(
                  e.target.value.replace(/\D/g, "").slice(0, MAX_DIGITS),
                )
              }
              className="font-display text-foreground placeholder:text-muted-foreground/60 w-full bg-transparent text-[40px] leading-none font-semibold tabular-nums outline-none"
            />
          </div>
        </div>

        <div
          role="group"
          aria-label="ยอดเงินลัด"
          className="grid grid-cols-2 gap-2"
        >
          {cashShortcuts(total).map((amount) => (
            <button
              key={amount}
              type="button"
              aria-pressed={received === amount}
              onClick={() => setDigits(String(amount))}
              className={cn(
                "focus-visible:ring-primary/50 h-11 cursor-pointer rounded-lg border px-3 text-sm font-semibold whitespace-nowrap tabular-nums transition-colors focus-visible:ring-2 focus-visible:outline-none",
                received === amount
                  ? "border-primary bg-primary-soft text-primary-strong"
                  : "border-border bg-surface text-foreground hover:bg-muted",
              )}
            >
              {amount === total ? "พอดี" : `฿${formatNumber(amount)}`}
            </button>
          ))}
        </div>

        <div
          role="status"
          className={cn(
            "flex items-baseline justify-between gap-3 rounded-xl px-4 py-3 transition-colors",
            enough && received > 0
              ? "bg-success-soft text-success-strong"
              : "bg-muted text-muted-foreground",
          )}
        >
          <span className="text-sm font-medium">
            {received > 0 && !enough ? "ยังขาดอีก" : "เงินทอน"}
          </span>
          <span className="font-display text-[30px] leading-none font-semibold tabular-nums">
            ฿{formatNumber(received === 0 ? 0 : Math.abs(change))}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              aria-label={key === "⌫" ? "ลบตัวเลขท้ายสุด" : key}
              onClick={() => press(key)}
              className="border-border bg-surface text-foreground hover:bg-muted active:bg-primary-soft focus-visible:ring-primary/50 flex h-14 cursor-pointer items-center justify-center rounded-xl border text-xl font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {key === "⌫" ? <Delete className="size-6" aria-hidden /> : key}
            </button>
          ))}
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={!enough}
          className="h-14 text-base"
        >
          ยืนยันรับเงิน
        </Button>
      </div>
    </form>
  );
}
