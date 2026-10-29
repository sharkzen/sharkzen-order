"use client";

import { useEffect, useState } from "react";
import { Banknote, CircleCheck, Printer, QrCode } from "lucide-react";
import { Button } from "@/components/ui";
import { formatNumber } from "@/features/dashboard/lib/format";
import { cn } from "@/lib/cn";
import {
  NO_DISCOUNT,
  calculateTotals,
  discountToBaht,
  isEmptyTable,
  roundTotal,
  type DiscountInput,
} from "@/features/cashier/lib/bill-utils";
import type {
  BillTotals,
  CheckoutConfig,
  CheckoutMethod,
  FinishAction,
  TableBill,
} from "@/features/cashier/types";
import { ElapsedTime } from "@/features/table-management/components/elapsed-time";
import { DiscountControl } from "./discount-control";
import { FinishActions } from "./finish-actions";

interface BillPanelProps {
  bill: TableBill;
  config: CheckoutConfig;
  /** ให้ส่วนลดได้ (สิทธิ์ cashier.discount) */
  canDiscount: boolean;
  /** กดวิธีชำระ: เปิดหน้าต่างรับเงิน พร้อมยอดที่ล็อกไว้ ณ ตอนนั้น */
  onPay: (method: CheckoutMethod, totals: BillTotals) => void;
  /** ทางเลือกหลังชำระแล้ว: พิมพ์ใบเสร็จ และ/หรือปิดโต๊ะ */
  onFinish: (bill: TableBill, action: FinishAction) => void;
}

/**
 * สรุปรายการและยอดชำระ (ฝั่งขวาของจอคิดเงิน): รายการย่อ → ส่วนลด → ยอดสุทธิ → ปุ่มรับเงิน
 * กดคีย์ C = เงินสด, T = โอนเงิน ได้เลยสำหรับแคชเชียร์ที่ใช้คีย์บอร์ด
 * ผู้เรียกควรใส่ key เป็นรหัสโต๊ะเพื่อรีเซ็ตส่วนลดเมื่อเปลี่ยนโต๊ะ
 */
export function BillPanel({ bill, config, canDiscount, onPay, onFinish }: BillPanelProps) {
  const [discount, setDiscount] = useState<DiscountInput>(NO_DISCOUNT);

  const paid = bill.payment;
  const empty = isEmptyTable(bill);
  const subtotal = bill.rounds.reduce((sum, round) => sum + roundTotal(round), 0);
  const live = calculateTotals(bill.rounds, discountToBaht(subtotal, discount), config);
  const totals: BillTotals = paid
    ? { ...live, subtotal: paid.subtotal, discount: paid.discount, serviceCharge: paid.serviceCharge, total: paid.total }
    : live;
  const canPay = !paid && !empty && totals.total > 0;
  const lines = bill.rounds.flatMap((round) => round.lines);

  // คีย์ลัด: ไม่ทำงานขณะพิมพ์ในช่องกรอก หรือมีหน้าต่างอื่นเปิดอยู่
  useEffect(() => {
    if (!canPay) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      if (document.querySelector("dialog[open]")) return;
      const key = event.key.toLowerCase();
      if (key === "c") onPay("cash", totals);
      else if (key === "t") onPay("transfer", totals);
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="border-border bg-surface shadow-card flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border">
      <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
        <h2 className="font-display text-foreground text-[22px] leading-tight font-semibold">สรุปรายการ</h2>
        {paid && (
          <Button variant="outline" size="sm" onClick={() => onFinish(bill, "print-only")}>
            <Printer className="size-4" aria-hidden />
            พิมพ์ใบเสร็จ
          </Button>
        )}
      </header>

      <div className="border-border mx-5 flex flex-col gap-0.5 border-b pb-4">
        <p className="font-display text-foreground text-lg leading-tight font-semibold">{bill.tableName}</p>
        <p className="text-muted-foreground text-xs">
          {bill.zone} • เข้าใช้เมื่อ {bill.openedAt} น. • นั่งมา <ElapsedTime openedAt={bill.openedAtMs} />
        </p>
      </div>

      <ul aria-label="รายการที่สั่ง" className="scroll-thin min-h-[72px] flex-1 overflow-y-auto px-5 py-3">
        {lines.length === 0 ? (
          <li className="text-muted-foreground py-6 text-center text-[13px]">ยังไม่มีรายการ</li>
        ) : (
          lines.map((line) => (
            <li key={line.id} className="flex items-baseline gap-3 py-2 text-[13px]">
              <span className="min-w-0 flex-1">
                <span className="text-foreground block truncate font-medium">{line.name}</span>
                {(line.options.length > 0 || line.note) && (
                  <span className="text-muted-foreground block truncate text-xs">
                    {[...line.options, line.note].filter(Boolean).join(" • ")}
                  </span>
                )}
              </span>
              <span className="text-muted-foreground w-10 shrink-0 text-right tabular-nums">{line.quantity} x</span>
              <span className="text-foreground w-16 shrink-0 text-right font-medium tabular-nums">
                ฿{formatNumber(line.unitPrice * line.quantity)}
              </span>
            </li>
          ))
        )}
      </ul>

      <div className="border-border flex flex-col gap-3 border-t border-dashed px-5 pt-4 pb-5">
        {!paid && canDiscount && !empty && <DiscountControl value={discount} onChange={setDiscount} />}
        <dl className="flex flex-col gap-1.5 text-[13px]">
          <Row label="รวมค่าอาหาร">฿{formatNumber(totals.subtotal)}</Row>
          {totals.discount > 0 && <Row label="ส่วนลด">−฿{formatNumber(totals.discount)}</Row>}
          {config.serviceChargePercent > 0 && (
            <Row label={`ค่าบริการ ${config.serviceChargePercent}%`}>฿{formatNumber(totals.serviceCharge)}</Row>
          )}
        </dl>

        <div className="bg-primary-soft flex items-end justify-between gap-3 rounded-xl px-4 py-3.5">
          <div className="flex flex-col">
            <p className="text-foreground text-sm font-semibold">ยอดที่ต้องชำระ</p>
            <p className="text-muted-foreground text-[11px]">
              {config.vatIncluded ? "รวมภาษีมูลค่าเพิ่ม 7% แล้ว" : "ราคานี้ยังไม่รวมภาษี"}
            </p>
          </div>
          <p className="font-display text-primary-strong text-[40px] leading-none font-semibold tabular-nums">
            ฿{formatNumber(totals.total)}
          </p>
        </div>

        {paid ? (
          <div className="flex flex-col gap-2">
            <p className="bg-success-soft text-success-strong flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-[13px] font-medium">
              <CircleCheck className="size-4 shrink-0" aria-hidden />
              ชำระแล้ว ({paid.method === "cash" ? "เงินสด" : "โอนเงิน"}) {paid.paidAt} น.
            </p>
            <FinishActions onFinish={(action) => onFinish(bill, action)} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <PayButton
              tone="cash"
              icon={<Banknote className="size-6" aria-hidden />}
              label="เงินสด"
              hint="C"
              disabled={!canPay}
              onClick={() => onPay("cash", totals)}
            />
            <PayButton
              tone="transfer"
              icon={<QrCode className="size-6" aria-hidden />}
              label="โอนเงิน"
              hint="T"
              disabled={!canPay}
              onClick={() => onPay("transfer", totals)}
            />
          </div>
        )}
        {!paid && !empty && totals.total <= 0 && (
          <p className="text-muted-foreground text-center text-xs">ยอดเป็น 0 บาท ลดส่วนลดลงก่อนจึงจะรับชำระได้</p>
        )}
        {!paid && empty && (
          <p className="text-muted-foreground text-center text-xs">เพิ่มเมนูทางซ้ายก่อนรับชำระ</p>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground tabular-nums">{children}</dd>
    </div>
  );
}

const PAY_TONES = {
  cash: "border-success-strong bg-surface text-success-strong hover:bg-success-soft focus-visible:ring-success/50 disabled:hover:bg-surface",
  transfer: "border-primary bg-primary text-white hover:bg-primary-strong focus-visible:ring-primary/50",
} as const;

function PayButton({
  tone,
  icon,
  label,
  hint,
  disabled,
  onClick,
}: {
  tone: keyof typeof PAY_TONES;
  icon: React.ReactNode;
  label: string;
  /** ปุ่มลัดบนคีย์บอร์ด แสดงเฉพาะจอที่มีคีย์บอร์ด */
  hint: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-keyshortcuts={hint}
      className={cn(
        "relative flex h-16 cursor-pointer items-center justify-center gap-2.5 rounded-xl border-2 text-lg font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        PAY_TONES[tone],
      )}
    >
      {icon}
      {label}
      <kbd
        aria-hidden
        className="absolute top-1.5 right-2 hidden rounded bg-current/10 px-1.5 py-px font-sans text-[10px] font-semibold lg:block"
      >
        {hint}
      </kbd>
    </button>
  );
}
