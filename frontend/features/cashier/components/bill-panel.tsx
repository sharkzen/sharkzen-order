"use client";

import { useState } from "react";
import { Banknote, CircleCheck, QrCode } from "lucide-react";
import { Badge } from "@/components/ui";
import { formatNumber } from "@/features/dashboard/lib/format";
import {
  NO_DISCOUNT,
  calculateTotals,
  discountToBaht,
  roundTotal,
  type DiscountInput,
} from "../lib/bill-utils";
import type {
  BillTotals,
  CheckoutConfig,
  CheckoutMethod,
  FinishAction,
  TableBill,
} from "../types";
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
 * ปุ่ม "เงินสด" และ "โอนเงิน" อยู่ล่างสุดเสมอ ผู้เรียกควรใส่ key เป็นรหัสโต๊ะเพื่อรีเซ็ตส่วนลดเมื่อเปลี่ยนโต๊ะ
 */
export function BillPanel({
  bill,
  config,
  canDiscount,
  onPay,
  onFinish,
}: BillPanelProps) {
  const [discount, setDiscount] = useState<DiscountInput>(NO_DISCOUNT);

  const paid = bill.payment;
  const subtotal = bill.rounds.reduce(
    (sum, round) => sum + roundTotal(round),
    0,
  );
  const live = calculateTotals(
    bill.rounds,
    discountToBaht(subtotal, discount),
    config,
  );
  const totals: BillTotals = paid
    ? {
        ...live,
        subtotal: paid.subtotal,
        discount: paid.discount,
        serviceCharge: paid.serviceCharge,
        total: paid.total,
      }
    : live;
  const dishTotal = totals.dishCount;

  return (
    <div className="border-border bg-surface flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border">
      <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex flex-col">
          <h2 className="font-display text-foreground text-2xl leading-tight font-semibold">
            {bill.tableName}
          </h2>
          <p className="text-muted-foreground text-xs">
            {bill.zone} • เปิดโต๊ะ {bill.openedAt} น.
          </p>
        </div>
        <p className="text-muted-foreground text-right text-xs">
          {bill.rounds.length} รอบ • {dishTotal} จาน
        </p>
      </header>

      <ol
        aria-label="รายการที่สั่ง"
        className="scroll-thin border-border min-h-[96px] flex-1 overflow-y-auto border-y border-dashed px-5 py-3"
      >
        {bill.rounds.map((round, index) => (
          <li
            key={round.orderId}
            className="flex flex-col gap-1 py-2 first:pt-0"
          >
            <div className="text-muted-foreground flex items-center justify-between gap-2 text-[11px]">
              <span>
                รอบที่ {index + 1} • {round.time} น.
              </span>
              {!round.served && (
                <Badge tone="warning" className="px-2 py-0.5 text-[11px]">
                  ครัวยังทำอยู่
                </Badge>
              )}
            </div>
            <ul className="flex flex-col gap-1">
              {round.lines.map((line) => (
                <li
                  key={line.name}
                  className="flex items-baseline justify-between gap-3 text-[13px]"
                >
                  <span className="text-foreground min-w-0">
                    <span className="text-muted-foreground inline-block w-7 tabular-nums">
                      {line.quantity}×
                    </span>
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
        {!paid && canDiscount && (
          <DiscountControl value={discount} onChange={setDiscount} />
        )}
        <dl className="flex flex-col gap-1.5 text-[13px]">
          <Row label="รวมค่าอาหาร">{formatNumber(totals.subtotal)}</Row>
          {totals.discount > 0 && (
            <Row label="ส่วนลด">−{formatNumber(totals.discount)}</Row>
          )}
          {config.serviceChargePercent > 0 && (
            <Row label={`ค่าบริการ ${config.serviceChargePercent}%`}>
              {formatNumber(totals.serviceCharge)}
            </Row>
          )}
        </dl>

        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col">
            <p className="text-foreground text-sm font-semibold">
              ยอดที่ต้องชำระ
            </p>
            <p className="text-muted-foreground text-[11px]">
              รวมภาษีมูลค่าเพิ่ม 7% แล้ว
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
              ชำระแล้ว ({paid.method === "cash" ? "เงินสด" : "โอนเงิน"}){" "}
              {paid.paidAt} น.
            </p>
            <FinishActions onFinish={(action) => onFinish(bill, action)} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <PayButton
              icon={<Banknote className="size-6" aria-hidden />}
              label="เงินสด"
              disabled={totals.total <= 0}
              onClick={() => onPay("cash", totals)}
            />
            <PayButton
              icon={<QrCode className="size-6" aria-hidden />}
              label="โอนเงิน"
              disabled={totals.total <= 0}
              onClick={() => onPay("transfer", totals)}
            />
          </div>
        )}
        {!paid && totals.total <= 0 && (
          <p className="text-muted-foreground text-center text-xs">
            ยอดเป็น 0 บาท ลดส่วนลดลงก่อนจึงจะรับชำระได้
          </p>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground tabular-nums">{children}</dd>
    </div>
  );
}

function PayButton({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="bg-primary text-primary-foreground hover:bg-primary-strong focus-visible:ring-primary/50 flex h-16 cursor-pointer items-center justify-center gap-2.5 rounded-xl text-lg font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      {icon}
      {label}
    </button>
  );
}
