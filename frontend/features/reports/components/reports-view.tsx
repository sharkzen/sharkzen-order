"use client";

import { useMemo } from "react";
import { Segmented } from "@/features/table-management/components/segmented";
import { exportSalesCsv } from "@/features/reports/lib/export-csv";
import {
  formatPeriod,
  methodTotals,
  splitPeriods,
  summarize,
  topMenus,
} from "@/features/reports/lib/report-utils";
import type { DailySales, RangeDays } from "@/features/reports/types";
import { PaymentMixCard } from "./payment-mix-card";
import { PeakHoursCard } from "./peak-hours-card";
import { ReportsPageHeader } from "./reports-page-header";
import { RevenueTrendCard } from "./revenue-trend-card";
import { SummaryCards } from "./summary-cards";
import { TopMenuCard } from "./top-menu-card";

const RANGE_OPTIONS: { value: RangeDays; label: string }[] = [
  { value: 7, label: "7 วัน" },
  { value: 14, label: "14 วัน" },
  { value: 30, label: "30 วัน" },
];

export { RANGE_OPTIONS };

interface ReportsViewProps {
  /** ข้อมูลรายวันเรียงเก่าไปใหม่ ยาวอย่างน้อย 2 เท่าของ range เพื่อเทียบช่วงก่อนหน้า */
  days: DailySales[];
  range: RangeDays;
  onRangeChange: (range: RangeDays) => void;
  firstHour: number;
  hourCount: number;
  updatedAt: string;
}

/**
 * พื้นที่ทำงานของหน้ารายงานยอดขาย (ไม่ดึงข้อมูลเอง จึงใช้เรนเดอร์เป็น skeleton ได้)
 * ทุกส่วนคำนวณจากข้อมูลรายวันชุดเดียว เปลี่ยนช่วงเวลาแล้วตัวเลขและกราฟเปลี่ยนพร้อมกัน
 */
export function ReportsView({ days, range, onRangeChange, firstHour, hourCount, updatedAt }: ReportsViewProps) {
  const report = useMemo(() => {
    const { current, previous } = splitPeriods(days, range);
    return {
      current,
      summary: summarize(current),
      previousSummary: summarize(previous),
      menus: topMenus(current),
      methods: methodTotals(current),
    };
  }, [days, range]);

  const from = report.current[0]?.date ?? "";
  const to = report.current[report.current.length - 1]?.date ?? "";
  const periodLabel = from ? formatPeriod(from, to) : "";

  return (
    <div className="flex w-full flex-col gap-5 sm:gap-6">
      <ReportsPageHeader
        onExport={() =>
          exportSalesCsv(
            report.current,
            `ยอดขาย-${from}-ถึง-${to}.csv`,
          )
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-[260px]">
          <Segmented
            label="ช่วงเวลาของรายงาน"
            value={range}
            options={RANGE_OPTIONS}
            onChange={onRangeChange}
          />
        </div>
        <p className="text-muted-foreground text-[13px]">{periodLabel}</p>
      </div>

      <SummaryCards
        current={report.summary}
        previous={report.previousSummary}
        compareLabel={`เทียบ ${range} วันก่อนหน้า`}
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <RevenueTrendCard key={range} days={report.current} />
        <PeakHoursCard days={report.current} firstHour={firstHour} hourCount={hourCount} />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <TopMenuCard menus={report.menus} />
        <PaymentMixCard totals={report.methods} />
      </div>

      <p className="text-muted-foreground text-[11px]">
        อัปเดตล่าสุด {updatedAt} • หน้านี้อัปเดตเองเมื่อมีการชำระเงินใหม่ •
        ยอดขายนับเฉพาะคำสั่งซื้อที่ชำระแล้วและไม่ถูกยกเลิก
      </p>
    </div>
  );
}
