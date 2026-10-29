import { dayOrders, dayRevenue, formatDayMonth } from "./report-utils";
import type { DailySales } from "@/features/reports/types";

/** ดาวน์โหลดยอดขายรายวันของช่วงที่เลือกเป็นไฟล์ CSV (ใส่ BOM เพื่อให้ Excel อ่านภาษาไทยถูกต้อง) */
export function exportSalesCsv(days: DailySales[], fileName: string) {
  const header = [
    "วันที่",
    "คำสั่งซื้อ",
    "ยอดขาย (บาท)",
    "เฉลี่ยต่อคำสั่งซื้อ (บาท)",
    "เงินสด",
    "โอนเงิน",
  ];
  const rows = days.map((day) => {
    const orders = dayOrders(day);
    const revenue = dayRevenue(day);
    return [
      `${day.date} (${formatDayMonth(day.date)})`,
      orders,
      revenue,
      orders > 0 ? Math.round(revenue / orders) : 0,
      day.methods.cash,
      day.methods.transfer,
    ];
  });

  const csv = [header, ...rows].map((row) => row.join(",")).join("\r\n");
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
