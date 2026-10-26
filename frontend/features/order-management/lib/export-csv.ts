import type { ManagedOrder } from "../types";
import {
  FOOD_STATUS_BADGE,
  PAYMENT_BADGE,
  PAYMENT_METHOD_LABEL,
} from "./labels";
import { summarizeItems } from "./order-utils";

function escapeCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** ดาวน์โหลดรายการที่กรองอยู่เป็นไฟล์ CSV (ใส่ BOM เพื่อให้ Excel อ่านภาษาไทยถูกต้อง) */
export function exportOrdersCsv(orders: ManagedOrder[], fileName: string) {
  const header = [
    "คำสั่งซื้อ",
    "เวลา",
    "โต๊ะ",
    "รายการอาหาร",
    "ยอดรวม (บาท)",
    "การชำระเงิน",
    "ช่องทาง",
    "สถานะอาหาร",
  ];
  const rows = orders.map((order) => [
    order.id,
    order.time,
    order.table,
    summarizeItems(order.items),
    order.total,
    PAYMENT_BADGE[order.paymentStatus].label,
    PAYMENT_METHOD_LABEL[order.paymentMethod],
    FOOD_STATUS_BADGE[order.status].label,
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(escapeCell).join(","))
    .join("\r\n");
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
