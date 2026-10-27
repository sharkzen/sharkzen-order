"use client";

import { useMemo, useState } from "react";
import { SectionCard } from "@/features/dashboard/components/shared/section-card";
import { formatNumber } from "@/features/dashboard/lib/format";
import { cn } from "@/lib/cn";
import { HOURS } from "../data/reports";
import {
  WEEKDAY_LONG,
  WEEKDAY_SHORT,
  buildHeatmap,
  formatHourRange,
} from "../lib/report-utils";
import type { DailySales, HeatCell } from "../types";

/** สีช่องจากสีหลักตามสัดส่วนยอดขาย (ช่องที่ขายน้อยสุดยังเห็นเป็นช่องจางๆ) */
function cellColor(average: number, max: number) {
  const share = max > 0 ? average / max : 0;
  const percent = Math.round(8 + share * 92);
  return `color-mix(in oklab, var(--primary) ${percent}%, var(--primary-soft))`;
}

/** ตารางความร้อนช่วงเวลาขายดี: แถวคือวันในสัปดาห์ คอลัมน์คือชั่วโมง ใช้วางแผนจัดคนและเตรียมของ */
export function PeakHoursCard({ days }: { days: DailySales[] }) {
  const cells = useMemo(() => buildHeatmap(days), [days]);
  const max = Math.max(...cells.map((cell) => cell.average));
  const best = cells.find((cell) => cell.average === max) ?? cells[0];
  const [hovered, setHovered] = useState<HeatCell | null>(null);
  const shown = hovered ?? best;

  return (
    <SectionCard title="ช่วงเวลาที่ขายดี" className="min-w-0">
      <p className="text-muted-foreground min-h-10 text-[13px]" role="status">
        {hovered ? "" : "ขายดีที่สุด "}
        <strong className="text-foreground font-semibold">
          {WEEKDAY_LONG[shown.weekday]} {formatHourRange(shown.hour)}
        </strong>{" "}
        เฉลี่ย{" "}
        <strong className="text-foreground font-semibold">
          {formatNumber(shown.average)} บาท
        </strong>{" "}
        ต่อวัน
      </p>

      <div className="scroll-thin -mx-1 overflow-x-auto px-1 pb-1">
        <div
          className="grid min-w-[440px] gap-[3px]"
          style={{
            gridTemplateColumns: `36px repeat(${HOURS.length}, minmax(0, 1fr))`,
          }}
          onMouseLeave={() => setHovered(null)}
        >
          <span aria-hidden />
          {HOURS.map((hour) => (
            <span
              key={hour}
              aria-hidden
              className="text-muted-foreground text-center text-[10px]"
            >
              {hour}
            </span>
          ))}

          {WEEKDAY_SHORT.map((label, weekday) => (
            <HeatRow
              key={label}
              label={label}
              cells={cells.filter((cell) => cell.weekday === weekday)}
              max={max}
              best={best}
              onActive={setHovered}
            />
          ))}
        </div>
      </div>

      <div className="text-muted-foreground flex items-center gap-2 text-[11px]">
        น้อย
        <span aria-hidden className="flex gap-[3px]">
          {[0, 0.25, 0.5, 0.75, 1].map((share) => (
            <span
              key={share}
              className="size-3.5 rounded-[3px]"
              style={{ backgroundColor: cellColor(share * max, max) }}
            />
          ))}
        </span>
        มาก • เฉลี่ยต่อวันของช่วงที่เลือก
      </div>
    </SectionCard>
  );
}

interface HeatRowProps {
  label: string;
  cells: HeatCell[];
  max: number;
  best: HeatCell;
  onActive: (cell: HeatCell | null) => void;
}

function HeatRow({ label, cells, max, best, onActive }: HeatRowProps) {
  return (
    <>
      <span
        aria-hidden
        className="text-muted-foreground flex items-center text-[11px]"
      >
        {label}
      </span>
      {cells.map((cell) => {
        const isBest = cell === best;
        return (
          <button
            key={cell.hour}
            type="button"
            aria-label={`${WEEKDAY_LONG[cell.weekday]} ${formatHourRange(cell.hour)} เฉลี่ย ${formatNumber(cell.average)} บาท`}
            onMouseEnter={() => onActive(cell)}
            onFocus={() => onActive(cell)}
            onBlur={() => onActive(null)}
            className={cn(
              "focus-visible:ring-primary/60 aspect-square min-h-6 cursor-pointer rounded-[4px] focus-visible:ring-2 focus-visible:outline-none",
              isBest && "ring-primary-strong ring-2 ring-offset-1",
            )}
            style={{ backgroundColor: cellColor(cell.average, max) }}
          />
        );
      })}
    </>
  );
}
