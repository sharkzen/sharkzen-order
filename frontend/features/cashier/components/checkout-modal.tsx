"use client";

import { useMemo } from "react";
import { CircleCheck } from "lucide-react";
import { Button, Dialog } from "@/components/ui";
import { formatNumber } from "@/features/dashboard/lib/format";
import { cn } from "@/lib/cn";
import { nowClock } from "@/features/cashier/lib/bill-utils";
import { buildPromptPayPayload } from "@/features/cashier/lib/promptpay";
import type {
  BillTotals,
  CheckoutConfig,
  CheckoutMethod,
  FinishAction,
  Payment,
  TableBill,
} from "@/features/cashier/types";
import { CashPad } from "./cash-pad";
import { FinishActions } from "./finish-actions";
import { ThaiQrCard } from "./thai-qr-card";

export interface CheckoutState {
  tableId: string;
  method: CheckoutMethod;
  /** ยอดที่ล็อกไว้ตอนกดชำระ เพื่อให้ตัวเลขในหน้าต่างไม่เปลี่ยนระหว่างรับเงิน */
  totals: BillTotals;
}

interface CheckoutModalProps {
  checkout: CheckoutState | null;
  bill: TableBill | null;
  config: CheckoutConfig;
  onSwitchMethod: (method: CheckoutMethod) => void;
  onPaid: (tableId: string, payment: Payment) => void;
  onFinish: (bill: TableBill, action: FinishAction) => void;
  /** ปิดหน้าต่างโดยเก็บโต๊ะไว้ (ถ้าชำระแล้วโต๊ะจะรอปิดอยู่) */
  onClose: () => void;
}

/**
 * หน้าต่างรับเงิน จัดเป็นสองคอลัมน์บนจอกลางขึ้นไปเพื่อให้พอดีหนึ่งจอไม่ต้องเลื่อน
 * เงินสด = ยอด/เงินทอน + ปุ่มตัวเลข, โอนเงิน = บัตร Thai QR Payment + ขั้นตอน
 * ชำระแล้วหน้าต่างเดิมเปลี่ยนเป็นสรุป พร้อมสามทางเลือก พิมพ์+ปิดโต๊ะ / พิมพ์อย่างเดียว / ปิดโต๊ะเลย
 */
export function CheckoutModal(props: CheckoutModalProps) {
  const { checkout, bill, onClose } = props;
  const done = bill?.payment != null;

  return (
    <Dialog
      open={checkout !== null && bill !== null}
      title={bill ? `รับชำระ ${bill.tableName}` : "รับชำระ"}
      onClose={onClose}
      className={cn("w-[min(96vw,440px)]", !done && "md:w-[min(96vw,720px)]")}
    >
      {checkout && bill && (
        <CheckoutBody {...props} checkout={checkout} bill={bill} />
      )}
    </Dialog>
  );
}

function CheckoutBody({
  checkout,
  bill,
  config,
  onSwitchMethod,
  onPaid,
  onFinish,
}: CheckoutModalProps & { checkout: CheckoutState; bill: TableBill }) {
  const { totals, method } = checkout;
  const payment = bill.payment;

  const payload = useMemo(
    () => buildPromptPayPayload(config.promptPayId, totals.total),
    [config.promptPayId, totals.total],
  );

  function pay(received?: number) {
    onPaid(bill.tableId, {
      method,
      paidAt: nowClock(),
      subtotal: totals.subtotal,
      discount: totals.discount,
      serviceCharge: totals.serviceCharge,
      total: totals.total,
      ...(received !== undefined && {
        received,
        change: received - totals.total,
      }),
    });
  }

  if (payment) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-6 text-center">
        <span className="bg-success-soft text-success-strong flex size-14 items-center justify-center rounded-full">
          <CircleCheck className="size-8" aria-hidden />
        </span>
        <div className="flex flex-col gap-1">
          <p aria-hidden className="font-display text-xl font-semibold">
            รับชำระ {bill.tableName} แล้ว
          </p>
          <p className="text-muted-foreground text-[13px]">
            {payment.method === "cash" ? "เงินสด" : "โอนเงินพร้อมเพย์"} • ฿
            {formatNumber(payment.total)} • {payment.paidAt} น.
          </p>
        </div>

        {payment.method === "cash" && payment.received !== undefined && (
          <div
            role="status"
            className="bg-success-soft flex w-full flex-col gap-0.5 rounded-xl px-4 py-3"
          >
            <p className="text-success-strong text-sm font-medium">
              ทอนเงินให้ลูกค้า
            </p>
            <p className="font-display text-success-strong text-[48px] leading-none font-semibold tabular-nums">
              ฿{formatNumber(payment.change ?? 0)}
            </p>
            <p className="text-muted-foreground text-xs">
              รับมา ฿{formatNumber(payment.received)}
            </p>
          </div>
        )}

        <div className="w-full">
          <FinishActions
            autoFocus
            onFinish={(action) => onFinish(bill, action)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1 pr-10">
        <p aria-hidden className="font-display text-xl font-semibold">
          {method === "cash" ? "รับเงินสด" : "โอนเงิน"} • {bill.tableName}
        </p>
        <p className="text-muted-foreground text-[13px]">
          {method === "cash"
            ? "กรอกเงินที่รับมา ระบบคำนวณเงินทอนให้"
            : "ให้ลูกค้าสแกนด้วยแอปธนาคาร ยอดจะถูกกรอกให้อัตโนมัติ"}
        </p>
      </div>

      {method === "cash" ? (
        <CashPad total={totals.total} onConfirm={pay} />
      ) : (
        <div className="grid items-center gap-5 md:grid-cols-[300px_minmax(0,1fr)]">
          <ThaiQrCard
            payload={payload}
            amount={totals.total}
            shopName={config.shopName}
          />
          <div className="flex flex-col gap-4">
            <ol className="text-muted-foreground flex list-decimal flex-col gap-1.5 pl-5 text-[13px]">
              <li>ให้ลูกค้าสแกนคิวอาร์โค้ดด้วยแอปธนาคาร</li>
              <li>
                เปิดแอปธนาคารของร้าน ดูว่ามียอด{" "}
                <strong className="text-foreground">
                  ฿{formatNumber(totals.total)}
                </strong>{" "}
                เข้าแล้ว
              </li>
              <li>กดยืนยันรับเงินด้านล่าง</li>
            </ol>
            {/* ตอนนี้ยังยืนยันยอดเข้าบัญชีเองไม่ได้ เมื่อเชื่อม Stripe ให้รอสถานะจาก webhook แล้วปิดบิลอัตโนมัติ */}
            <Button size="lg" className="h-14 text-base" onClick={() => pay()}>
              ได้รับเงินโอนแล้ว
            </Button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => onSwitchMethod(method === "cash" ? "transfer" : "cash")}
        className="text-primary-strong focus-visible:ring-primary/50 w-fit cursor-pointer self-center rounded text-[13px] font-medium hover:underline focus-visible:ring-2 focus-visible:outline-none"
      >
        {method === "cash" ? "ลูกค้าโอนเงินแทน" : "ลูกค้าจ่ายเงินสดแทน"}
      </button>
    </div>
  );
}
