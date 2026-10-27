"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { formatNumber } from "@/features/dashboard/lib/format";
import { BILL_DATE } from "../data/bills";
import { mergeLines } from "../lib/bill-utils";
import type { CheckoutConfig, Payment, TableBill } from "../types";

interface ReceiptSheetProps {
  bill: TableBill;
  payment: Payment;
  config: CheckoutConfig;
  /** เรียกเมื่อหน้าต่างพิมพ์ปิดแล้ว (พิมพ์หรือยกเลิกก็ตาม) */
  onDone: () => void;
}

const METHOD_LABEL = { cash: "เงินสด", transfer: "โอนเงินพร้อมเพย์" } as const;

/**
 * ใบเสร็จขนาดกระดาษความร้อน 80 มม. วางผ่าน portal ที่ body แล้วสั่งพิมพ์ทันที
 * CSS ใน globals.css (#print-root) ซ่อนส่วนอื่นของหน้าตอนพิมพ์ ใช้กลไกเดียวกับการพิมพ์ QR โต๊ะ
 */
export function ReceiptSheet({
  bill,
  payment,
  config,
  onDone,
}: ReceiptSheetProps) {
  useEffect(() => {
    // รอหนึ่งเฟรมให้ใบเสร็จวาดเสร็จก่อนเปิดหน้าต่างพิมพ์ (window.print รอจนปิดหน้าต่างพิมพ์)
    const id = setTimeout(() => {
      window.print();
      onDone();
    }, 250);
    return () => clearTimeout(id);
  }, [onDone]);

  const lines = mergeLines(bill.rounds);

  return createPortal(
    <div id="print-root" className="hidden print:block">
      <style>{`@page { size: 80mm auto; margin: 4mm; }`}</style>
      <div
        style={{
          width: "72mm",
          color: "#000",
          fontSize: "12px",
          lineHeight: 1.45,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "16px", fontWeight: 700 }}>{config.shopName}</p>
          {config.branch && <p>{config.branch}</p>}
          <p>{config.address}</p>
          <p>โทร {config.phone}</p>
        </div>

        <Divider />
        <Pair label="โต๊ะ" value={bill.tableName} />
        <Pair label="วันที่" value={`${BILL_DATE} ${payment.paidAt} น.`} />
        <Divider />

        {lines.map((line) => (
          <div
            key={`${line.name}-${line.unitPrice}`}
            style={{ display: "flex", justifyContent: "space-between", gap: 8 }}
          >
            <span>
              {line.quantity} × {line.name}
            </span>
            <span>{formatNumber(line.unitPrice * line.quantity)}</span>
          </div>
        ))}

        <Divider />
        <Pair label="รวมค่าอาหาร" value={formatNumber(payment.subtotal)} />
        {payment.discount > 0 && (
          <Pair label="ส่วนลด" value={`-${formatNumber(payment.discount)}`} />
        )}
        {payment.serviceCharge > 0 && (
          <Pair label="ค่าบริการ" value={formatNumber(payment.serviceCharge)} />
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "16px",
            fontWeight: 700,
            marginTop: 4,
          }}
        >
          <span>ยอดสุทธิ</span>
          <span>{formatNumber(payment.total)} บาท</span>
        </div>
        <p style={{ textAlign: "right", fontSize: "10px" }}>
          รวมภาษีมูลค่าเพิ่ม 7% (
          {formatNumber(Math.round((payment.total * 7) / 107))} บาท)
        </p>

        <Divider />
        <Pair label="ชำระโดย" value={METHOD_LABEL[payment.method]} />
        {payment.method === "cash" && payment.received !== undefined && (
          <>
            <Pair label="รับเงินมา" value={formatNumber(payment.received)} />
            <Pair label="เงินทอน" value={formatNumber(payment.change ?? 0)} />
          </>
        )}

        <Divider />
        <p style={{ textAlign: "center" }}>ขอบคุณที่ใช้บริการ</p>
        <p style={{ textAlign: "center", fontSize: "10px" }}>
          ใบเสร็จรับเงิน (ไม่ใช่ใบกำกับภาษี)
        </p>
      </div>
    </div>,
    document.body,
  );
}

function Divider() {
  return (
    <hr
      style={{
        border: 0,
        borderTop: "1px dashed #000",
        margin: "6px 0",
      }}
    />
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
