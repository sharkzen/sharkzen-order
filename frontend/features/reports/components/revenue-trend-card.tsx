"use client";

import { useState } from "react";
import { formatNumber } from "@/features/dashboard/lib/format";
import { Segmented } from "@/features/table-management/components/segmented";
import { SectionCard } from "@/features/dashboard/components/shared/section-card";
import { cn } from "@/lib/cn";
import {
  WEEKDAY_SHORT,
  dayOrders,
  dayRevenue,
  formatDayMonth,
  weekdayIndex,
} from "../lib/report-utils";
import type { DailySales } from "../types";

type View = "chart" | "table";

const VIEW_OPTIONS: { value: View; label: string }[] = [
  { value: "chart", label: "กราฟ" },
  { value: "table", label: "ตาราง" },
];

/** ป้ายวันที่ใต้กราฟ แสดงห่างๆ ตามจำนวนวัน เพื่อไม่ให้ข้อความทับกัน */
function labelStep(count: number) {
  if (count <= 7) return 1;
  if (count <= 14) return 2;
  return 5;
}

/** แกนตั้งปัดขึ้นเป็นหลักพัน เพื่อให้เส้นแบ่งอ่านง่าย */
function niceMax(value: number) {
  return Math.max(1000, Math.ceil(value / 1000) * 1000);
}

/** ยอดขายรายวัน แท่งเดียวสีเดียว ไฮไลต์วันขายดีที่สุด มีเส้นค่าเฉลี่ยและตารางสำรอง */
export function RevenueTrendCard({ days }: { days: DailySales[] }) {
  const [view, setView] = useState<View>("chart");
  const [active, setActive] = useState<number | null>(null);

  const revenues = days.map(dayRevenue);
  const peak = Math.max(...revenues);
  const peakIndex = revenues.indexOf(peak);
  const average = Math.round(
    revenues.reduce((sum, value) => sum + value, 0) / days.length,
  );
  const axisMax = niceMax(peak);
  const ticks = [axisMax, (axisMax / 3) * 2, axisMax / 3, 0].map(Math.round);
  const step = labelStep(days.length);

  return (
    <SectionCard title="ยอดขายรายวัน" className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-[13px]">
          เฉลี่ย{" "}
          <strong className="text-foreground font-semibold">
            {formatNumber(average)} บาท
          </strong>{" "}
          ต่อวัน • ขายดีสุด{" "}
          <strong className="text-foreground font-semibold">
            {formatDayMonth(days[peakIndex].date)}
          </strong>{" "}
          ({formatNumber(peak)} บาท)
        </p>
        <div className="w-[148px]">
          <Segmented
            label="รูปแบบการแสดงผล"
            value={view}
            options={VIEW_OPTIONS}
            onChange={setView}
          />
        </div>
      </div>

      {view === "chart" ? (
        <div className="flex flex-col gap-2">
          <div className="flex h-56 items-stretch gap-3">
            <div
              aria-hidden
              className="text-muted-foreground flex w-10 flex-col justify-between text-right text-[10px]"
            >
              {ticks.map((tick) => (
                <span key={tick}>{formatNumber(tick)}</span>
              ))}
            </div>
            <div
              className="relative flex-1"
              onMouseLeave={() => setActive(null)}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 flex flex-col justify-between"
              >
                {ticks.map((tick) => (
                  <span key={tick} className="border-border border-t" />
                ))}
              </div>
              <span
                aria-hidden
                className="border-primary/60 pointer-events-none absolute inset-x-0 border-t border-dashed"
                style={{ bottom: `${(average / axisMax) * 100}%` }}
              />

              <ul
                aria-label="ยอดขายรายวัน"
                className="relative flex h-full items-end gap-[3px] sm:gap-1.5"
              >
                {days.map((day, index) => (
                  <li key={day.date} className="h-full min-w-0 flex-1">
                    <button
                      type="button"
                      aria-label={`${formatDayMonth(day.date)} ยอดขาย ${formatNumber(revenues[index])} บาท`}
                      onMouseEnter={() => setActive(index)}
                      onFocus={() => setActive(index)}
                      onBlur={() => setActive(null)}
                      className="focus-visible:ring-primary/50 flex h-full w-full cursor-pointer items-end rounded-t-[4px] focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <span
                        className={cn(
                          "block w-full rounded-t-[4px] transition-[height,background-color] duration-500",
                          index === active
                            ? "bg-primary-strong"
                            : index === peakIndex
                              ? "bg-primary"
                              : "bg-primary-muted",
                        )}
                        style={{
                          height: `${(revenues[index] / axisMax) * 100}%`,
                        }}
                      />
                    </button>
                  </li>
                ))}
              </ul>

              {active !== null && (
                <Tooltip
                  day={days[active]}
                  index={active}
                  count={days.length}
                  average={average}
                />
              )}
            </div>
          </div>

          <div aria-hidden className="flex gap-3">
            <span className="w-10" />
            <div className="flex flex-1 gap-[3px] sm:gap-1.5">
              {days.map((day, index) => (
                <span
                  key={day.date}
                  className="text-muted-foreground relative h-4 min-w-0 flex-1 text-[10px]"
                >
                  {index % step === 0 && (
                    <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
                      {formatDayMonth(day.date)}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
          <p className="text-muted-foreground flex items-center gap-2 text-[11px]">
            <span
              aria-hidden
              className="border-primary/60 inline-block w-5 border-t border-dashed"
            />
            ค่าเฉลี่ยต่อวัน • วางเมาส์หรือกด Tab บนแท่งเพื่อดูรายละเอียด
          </p>
        </div>
      ) : (
        <TrendTable days={days} />
      )}
    </SectionCard>
  );
}

function Tooltip({
  day,
  index,
  count,
  average,
}: {
  day: DailySales;
  index: number;
  count: number;
  average: number;
}) {
  const revenue = dayRevenue(day);
  const diff = revenue - average;
  const ratio = (index + 0.5) / count;
  const shift = ratio < 0.2 ? "0%" : ratio > 0.8 ? "-100%" : "-50%";

  return (
    <div
      role="status"
      className="border-border bg-surface shadow-float pointer-events-none absolute top-0 z-10 w-44 rounded-lg border p-3 text-xs"
      style={{ left: `${ratio * 100}%`, transform: `translateX(${shift})` }}
    >
      <p className="text-foreground font-semibold">
        {WEEKDAY_SHORT[weekdayIndex(day.date)]} {formatDayMonth(day.date)}
      </p>
      <p className="font-display text-foreground mt-1 text-lg leading-tight font-semibold">
        {formatNumber(revenue)} บาท
      </p>
      <p className="text-muted-foreground mt-1">
        {formatNumber(dayOrders(day))} คำสั่งซื้อ
      </p>
      <p className="text-muted-foreground">
        {diff >= 0 ? "สูงกว่า" : "ต่ำกว่า"}ค่าเฉลี่ย{" "}
        {formatNumber(Math.abs(diff))} บาท
      </p>
    </div>
  );
}

function TrendTable({ days }: { days: DailySales[] }) {
  const rows = [...days].reverse();
  return (
    <div className="scroll-thin border-border max-h-72 overflow-auto rounded-lg border">
      <table className="w-full min-w-[420px] text-left text-[13px]">
        <thead className="bg-muted text-muted-foreground sticky top-0 text-xs">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-medium">
              วันที่
            </th>
            <th scope="col" className="px-4 py-2.5 text-right font-medium">
              คำสั่งซื้อ
            </th>
            <th scope="col" className="px-4 py-2.5 text-right font-medium">
              ยอดขาย (บาท)
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((day) => (
            <tr key={day.date} className="border-border border-t">
              <th
                scope="row"
                className="text-foreground px-4 py-2.5 font-medium"
              >
                {WEEKDAY_SHORT[weekdayIndex(day.date)]}{" "}
                {formatDayMonth(day.date)}
              </th>
              <td className="px-4 py-2.5 text-right tabular-nums">
                {formatNumber(dayOrders(day))}
              </td>
              <td className="text-foreground px-4 py-2.5 text-right font-semibold tabular-nums">
                {formatNumber(dayRevenue(day))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
