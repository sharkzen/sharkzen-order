"use client";

import { useMemo, useState } from "react";
import { Segmented } from "@/features/table-management/components/segmented";
import { REPORT_END_DATE, UPDATED_AT } from "../data/reports";
import { exportSalesCsv } from "../lib/export-csv";
import {
  formatPeriod,
  methodTotals,
  splitPeriods,
  summarize,
  topMenus,
} from "../lib/report-utils";
import type { DailySales, RangeDays } from "../types";
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

/**
 * พื้นที่ทำงานของหน้ารายงานยอดขาย (client เพราะมีตัวเลือกช่วงเวลา)
 * ทุกส่วนคำนวณจากข้อมูลรายวันชุดเดียว เปลี่ยนช่วงเวลาแล้วตัวเลขและกราฟเปลี่ยนพร้อมกัน
 */
export function ReportsWorkspace({ days }: { days: DailySales[] }) {
  const [range, setRange] = useState<RangeDays>(7);

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

  const from = report.current[0].date;
  const periodLabel = formatPeriod(from, REPORT_END_DATE);

  return (
    <div className="flex w-full flex-col gap-5 sm:gap-6">
      <ReportsPageHeader
        onExport={() =>
          exportSalesCsv(
            report.current,
            `ยอดขาย-${from}-ถึง-${REPORT_END_DATE}.csv`,
          )
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-[260px]">
          <Segmented
            label="ช่วงเวลาของรายงาน"
            value={range}
            options={RANGE_OPTIONS}
            onChange={setRange}
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
        <PeakHoursCard days={report.current} />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <TopMenuCard menus={report.menus} />
        <PaymentMixCard totals={report.methods} />
      </div>

      <p className="text-muted-foreground text-[11px]">
        อัปเดตล่าสุด {UPDATED_AT} •
        ยอดขายนับเฉพาะคำสั่งซื้อที่ชำระแล้วและไม่ถูกยกเลิก
      </p>
    </div>
  );
}
