"use client";

import { useEffect, useState } from "react";
import { Banknote, CircleCheck, CookingPot, DoorClosed, QrCode } from "lucide-react";
import { Button } from "@/components/ui";
import { formatNumber } from "@/features/dashboard/lib/format";
import { cn } from "@/lib/cn";
import {
  NO_DISCOUNT,
  calculateTotals,
  discountToBaht,
  isEmptyTable,
  roundTotal,
  unservedCount,
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
 * บิลของโต๊ะที่เลือก จัดให้พอดีหนึ่งหน้าจอไม่ต้องเลื่อน: หัวบิล → รายการ (เลื่อนเฉพาะส่วนนี้) → ยอดรวมและปุ่มชำระ
 * ปุ่มรับชำระอยู่ล่างสุดเสมอ กดคีย์ C = เงินสด, T = โอนเงิน ได้เลยสำหรับแคชเชียร์ที่ใช้คีย์บอร์ด
 * ผู้เรียกควรใส่ key เป็นรหัสโต๊ะเพื่อรีเซ็ตส่วนลดเมื่อเปลี่ยนโต๊ะ
 */
export function BillPanel({ bill, config, canDiscount, onPay, onFinish }: BillPanelProps) {
  const [discount, setDiscount] = useState<DiscountInput>(NO_DISCOUNT);

  const paid = bill.payment;
  const empty = isEmptyTable(bill);
  const pending = unservedCount(bill);
  const subtotal = bill.rounds.reduce((sum, round) => sum + roundTotal(round), 0);
  const live = calculateTotals(bill.rounds, discountToBaht(subtotal, discount), config);
  const totals: BillTotals = paid
    ? { ...live, subtotal: paid.subtotal, discount: paid.discount, serviceCharge: paid.serviceCharge, total: paid.total }
    : live;
  const canPay = !paid && !empty && totals.total > 0;

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
    <div className="border-border bg-surface flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border">
      <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex flex-col">
          <h2 className="font-display text-foreground text-2xl leading-tight font-semibold">{bill.tableName}</h2>
          <p className="text-muted-foreground text-xs">
            {bill.zone} • เปิดโต๊ะ {bill.openedAt} น. • นั่งมา <ElapsedTime openedAt={bill.openedAtMs} />
          </p>
        </div>
        {!empty && (
          <p className="text-muted-foreground shrink-0 text-right text-xs">
            {bill.rounds.length} ออเดอร์
            <br />
            {totals.dishCount} จาน
          </p>
        )}
      </header>

      {!paid && pending > 0 && (
        <p className="bg-warning-soft text-warning-strong mx-5 mb-3 flex items-start gap-2 rounded-lg px-3.5 py-2.5 text-[13px]">
          <CookingPot className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            ครัวยังทำอีก {pending} ออเดอร์ รับเงินก่อนได้ถ้าลูกค้าต้องการ
            แต่ควรรอเสิร์ฟครบก่อนปิดโต๊ะ
          </span>
        </p>
      )}

      {empty ? (
        <div className="border-border flex flex-1 flex-col items-center justify-center gap-4 border-y border-dashed px-6 py-8 text-center">
          <span className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
            <DoorClosed className="size-7" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-foreground text-[15px] font-semibold">โต๊ะนี้ยังไม่มีออเดอร์</p>
            <p className="text-muted-foreground text-[13px]">ถ้าลูกค้าไม่สั่งแล้ว ปิดโต๊ะเพื่อเปิดรับกลุ่มถัดไปได้เลย</p>
          </div>
          <Button variant="outline" onClick={() => onFinish(bill, "close-only")}>
            ปิดโต๊ะ
          </Button>
        </div>
      ) : (
        <>
          <ol
            aria-label="รายการที่สั่ง"
            className="scroll-thin border-border min-h-[96px] flex-1 overflow-y-auto border-y border-dashed px-5 py-3"
          >
            {bill.rounds.map((round) => (
              <li key={round.orderId} className="flex flex-col gap-1 py-2 first:pt-0">
                <div className="text-muted-foreground flex items-center justify-between gap-2 text-[11px]">
                  <span>
                    ออเดอร์ #{round.number} • {round.time} น.
                  </span>
                  <span className={cn("font-medium", round.served ? "text-success-strong" : "text-warning-strong")}>
                    {round.served ? "เสิร์ฟแล้ว" : "ครัวยังทำอยู่"}
                  </span>
                </div>
                <ul className="flex flex-col gap-1">
                  {round.lines.map((line) => (
                    <li key={line.name} className="flex items-baseline justify-between gap-3 text-[13px]">
                      <span className="text-foreground min-w-0">
                        <span className="text-muted-foreground inline-block w-7 tabular-nums">{line.quantity}×</span>
                        {line.name}
                      </span>
                      <span className="text-foreground shrink-0 tabular-nums">
                        {formatNumber(line.unitPrice * line.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>

          <div className="flex flex-col gap-3 px-5 pt-3 pb-5">
            {!paid && canDiscount && <DiscountControl value={discount} onChange={setDiscount} />}
            <dl className="flex flex-col gap-1.5 text-[13px]">
              <Row label="รวมค่าอาหาร">{formatNumber(totals.subtotal)}</Row>
              {totals.discount > 0 && <Row label="ส่วนลด">−{formatNumber(totals.discount)}</Row>}
              {config.serviceChargePercent > 0 && (
                <Row label={`ค่าบริการ ${config.serviceChargePercent}%`}>{formatNumber(totals.serviceCharge)}</Row>
              )}
            </dl>

            <div className="bg-primary-soft flex items-end justify-between gap-3 rounded-xl px-4 py-3">
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
            {!paid && totals.total <= 0 && (
              <p className="text-muted-foreground text-center text-xs">ยอดเป็น 0 บาท ลดส่วนลดลงก่อนจึงจะรับชำระได้</p>
            )}
          </div>
        </>
      )}
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
  cash: "bg-success-strong hover:bg-success-strong/90 focus-visible:ring-success/50",
  transfer: "bg-primary hover:bg-primary-strong focus-visible:ring-primary/50",
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
        "relative flex h-16 cursor-pointer items-center justify-center gap-2.5 rounded-xl text-lg font-semibold text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        PAY_TONES[tone],
      )}
    >
      {icon}
      {label}
      <kbd
        aria-hidden
        className="absolute top-1.5 right-2 hidden rounded bg-white/20 px-1.5 py-px font-sans text-[10px] font-semibold lg:block"
      >
        {hint}
      </kbd>
    </button>
  );
}
