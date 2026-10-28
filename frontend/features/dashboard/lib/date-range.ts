export type RangePreset = "today" | "yesterday" | "week" | "month" | "custom";
export type CustomMode = "day" | "month";

export interface DateRange {
  /** YYYY-MM-DD ตามเวลาไทย (รวมวันเริ่มและวันสิ้นสุด) */
  from: string;
  to: string;
}

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;

export const PRESETS: { id: RangePreset; label: string }[] = [
  { id: "today", label: "วันนี้" },
  { id: "yesterday", label: "เมื่อวาน" },
  { id: "week", label: "7 วันล่าสุด" },
  { id: "month", label: "เดือนนี้" },
  { id: "custom", label: "กำหนดเอง" },
];

/** วันที่ปัจจุบันตามเวลาไทย (YYYY-MM-DD) */
export function todayBangkok() {
  return new Date(Date.now() + BANGKOK_OFFSET_MS).toISOString().slice(0, 10);
}

export function shiftDate(date: string, days: number) {
  return new Date(Date.parse(date) + days * DAY_MS).toISOString().slice(0, 10);
}

export function lastDayOfMonth(month: string) {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m, 0)).toISOString().slice(0, 10);
}

export function presetRange(preset: Exclude<RangePreset, "custom">): DateRange {
  const today = todayBangkok();
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const yesterday = shiftDate(today, -1);
      return { from: yesterday, to: yesterday };
    }
    case "week":
      return { from: shiftDate(today, -6), to: today };
    case "month":
      return { from: `${today.slice(0, 7)}-01`, to: today };
  }
}

/** ช่วงจากช่องเลือกเดือน: ตั้งแต่วันที่ 1 ของเดือนเริ่ม ถึงสิ้นเดือนสุดท้าย (ไม่เกินวันนี้) */
export function monthsRange(fromMonth: string, toMonth: string): DateRange {
  const today = todayBangkok();
  const last = lastDayOfMonth(toMonth);
  return { from: `${fromMonth}-01`, to: last > today ? today : last };
}

const thaiDate = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("th-TH", {
    timeZone: "UTC",
    ...options,
  });

/** ป้ายช่วงวันที่ เช่น "24 ต.ค. 2569" หรือ "1 ต.ค. – 24 ต.ค. 2569" */
export function formatRange({ from, to }: DateRange) {
  const full = { day: "numeric", month: "short", year: "numeric" } as const;
  if (from === to) return thaiDate(from, full);
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  const start = thaiDate(
    from,
    sameYear ? { day: "numeric", month: "short" } : full,
  );
  return `${start} – ${thaiDate(to, full)}`;
}

export function formatDay(date: string) {
  return thaiDate(date, { day: "numeric", month: "short" });
}

export function formatMonth(month: string) {
  return thaiDate(`${month}-01`, { month: "short", year: "2-digit" });
}
