"use client";

import { DatePicker, FilterField, Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ApiOrderStatus, ApiPaymentStatus } from "@/features/dashboard/lib/dashboard-api";
import {
  PRESETS,
  monthsRange,
  presetRange,
  todayBangkok,
  type CustomMode,
  type DateRange,
  type RangePreset,
} from "@/features/dashboard/lib/date-range";

export interface DashboardFilterState extends DateRange {
  preset: RangePreset;
  customMode: CustomMode;
  status: ApiOrderStatus | "";
  payment: ApiPaymentStatus | "";
}

const STATUS_OPTIONS = [
  { value: "", label: "ทุกสถานะ" },
  { value: "NEW", label: "ใหม่" },
  { value: "PREPARING", label: "กำลังทำ" },
  { value: "READY", label: "เสิร์ฟแล้ว" },
  { value: "SERVED", label: "เสร็จสิ้น" },
  { value: "CANCELLED", label: "ยกเลิก" },
];

const PAYMENT_OPTIONS = [
  { value: "", label: "ทุกการชำระเงิน" },
  { value: "PAID", label: "ชำระแล้ว" },
  { value: "UNPAID", label: "ยังไม่ชำระ" },
];

interface DashboardFiltersProps {
  value: DashboardFilterState;
  onChange: (next: DashboardFilterState) => void;
}

/** ตัวกรองภาพรวม: ช่วงเวลา (ลัด/กำหนดเองเป็นวันหรือเดือน) สถานะออเดอร์ และการชำระเงิน */
export function DashboardFilters({ value, onChange }: DashboardFiltersProps) {
  const today = todayBangkok();
  const thisMonth = today.slice(0, 7);

  const patch = (next: Partial<DashboardFilterState>) =>
    onChange({ ...value, ...next });

  function selectPreset(preset: RangePreset) {
    if (preset === "custom") return patch({ preset });
    patch({ preset, ...presetRange(preset) });
  }

  function selectMode(customMode: CustomMode) {
    if (customMode === "month") {
      patch({
        customMode,
        ...monthsRange(value.from.slice(0, 7), value.to.slice(0, 7)),
      });
    } else patch({ customMode });
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="group"
        aria-label="ช่วงเวลา"
        className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
      >
        {PRESETS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={value.preset === id}
            onClick={() => selectPreset(id)}
            className={cn(
              "focus-visible:ring-primary/50 h-10 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
              value.preset === id
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-muted-foreground hover:bg-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {value.preset === "custom" && (
          <>
            <FilterField label="รูปแบบ" htmlFor="range-mode">
              <Select
                size="lg"
                id="range-mode"
                value={value.customMode}
                onChange={(v) => selectMode(v as CustomMode)}
                options={[
                  { value: "day", label: "เลือกเป็นวัน" },
                  { value: "month", label: "เลือกเป็นเดือน" },
                ]}
              />
            </FilterField>
            {value.customMode === "day" ? (
              <>
                <FilterField label="ตั้งแต่วันที่" htmlFor="range-from">
                  <DatePicker
                    id="range-from"
                    size="lg"
                    value={value.from}
                    max={value.to}
                    onChange={(v) => patch({ from: v })}
                  />
                </FilterField>
                <FilterField label="ถึงวันที่" htmlFor="range-to">
                  <DatePicker
                    id="range-to"
                    size="lg"
                    value={value.to}
                    min={value.from}
                    max={today}
                    onChange={(v) => patch({ to: v })}
                  />
                </FilterField>
              </>
            ) : (
              <>
                <FilterField label="ตั้งแต่เดือน" htmlFor="range-from-month">
                  <DatePicker
                    id="range-from-month"
                    size="lg"
                    mode="month"
                    value={value.from.slice(0, 7)}
                    max={value.to.slice(0, 7)}
                    onChange={(v) => patch(monthsRange(v, value.to.slice(0, 7)))}
                  />
                </FilterField>
                <FilterField label="ถึงเดือน" htmlFor="range-to-month">
                  <DatePicker
                    id="range-to-month"
                    size="lg"
                    mode="month"
                    value={value.to.slice(0, 7)}
                    min={value.from.slice(0, 7)}
                    max={thisMonth}
                    onChange={(v) => patch(monthsRange(value.from.slice(0, 7), v))}
                  />
                </FilterField>
              </>
            )}
          </>
        )}
        <FilterField label="สถานะคำสั่งซื้อ" htmlFor="filter-status">
          <Select
            size="lg"
            id="filter-status"
            value={value.status}
            onChange={(v) =>
              patch({ status: v as ApiOrderStatus | "" })
            }
            options={STATUS_OPTIONS}
          />
        </FilterField>
        <FilterField label="การชำระเงิน" htmlFor="filter-payment">
          <Select
            size="lg"
            id="filter-payment"
            value={value.payment}
            onChange={(v) =>
              patch({ payment: v as ApiPaymentStatus | "" })
            }
            options={PAYMENT_OPTIONS}
          />
        </FilterField>
      </div>
    </div>
  );
}
