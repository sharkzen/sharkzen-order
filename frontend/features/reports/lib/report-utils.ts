import type {
  DailySales,
  HeatCell,
  PeriodSummary,
  RangeDays,
  TopMenu,
} from "@/features/reports/types";

const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

export const WEEKDAY_SHORT = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];
export const WEEKDAY_LONG = [
  "วันจันทร์",
  "วันอังคาร",
  "วันพุธ",
  "วันพฤหัสบดี",
  "วันศุกร์",
  "วันเสาร์",
  "วันอาทิตย์",
];

function parseIso(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
}

/** "24 ต.ค." */
export function formatDayMonth(iso: string) {
  const { month, day } = parseIso(iso);
  return `${day} ${THAI_MONTHS_SHORT[month - 1]}`;
}

/** "18–24 ต.ค. 2569" หรือ "28 ก.ย. – 24 ต.ค. 2569" เมื่อข้ามเดือน */
export function formatPeriod(from: string, to: string) {
  const a = parseIso(from);
  const b = parseIso(to);
  const year = b.year + 543;
  if (a.month === b.month && a.year === b.year) {
    return `${a.day}–${b.day} ${THAI_MONTHS_SHORT[b.month - 1]} ${year}`;
  }
  return `${formatDayMonth(from)} – ${formatDayMonth(to)} ${year}`;
}

export function weekdayIndex(iso: string) {
  const { year, month, day } = parseIso(iso);
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

export function dayRevenue(day: DailySales) {
  return day.hours.reduce((sum, hour) => sum + hour.revenue, 0);
}

export function dayOrders(day: DailySales) {
  return day.hours.reduce((sum, hour) => sum + hour.orders, 0);
}

/** ช่วงปัจจุบัน (n วันล่าสุด) และช่วงก่อนหน้าที่ยาวเท่ากัน ไว้เทียบการเปลี่ยนแปลง */
export function splitPeriods(days: DailySales[], range: RangeDays) {
  const current = days.slice(-range);
  const previous = days.slice(-range * 2, -range);
  return { current, previous };
}

export function summarize(days: DailySales[]): PeriodSummary {
  const revenue = days.reduce((sum, day) => sum + dayRevenue(day), 0);
  const orders = days.reduce((sum, day) => sum + dayOrders(day), 0);
  const dishes = days.reduce(
    (sum, day) => sum + day.menu.reduce((n, menu) => n + menu.quantity, 0),
    0,
  );
  return {
    revenue,
    orders,
    dishes,
    average: orders > 0 ? Math.round(revenue / orders) : 0,
  };
}

/** เปลี่ยนแปลงเป็น % ทศนิยม 1 ตำแหน่ง คืน null เมื่อไม่มีช่วงก่อนหน้าให้เทียบ */
export function changePercent(current: number, previous: number) {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function topMenus(days: DailySales[], limit = 6): TopMenu[] {
  const merged = new Map<string, TopMenu>();
  for (const menu of days.flatMap((day) => day.menu)) {
    const found = merged.get(menu.name);
    if (found) {
      found.quantity += menu.quantity;
      found.revenue += menu.revenue;
    } else merged.set(menu.name, { ...menu });
  }
  return [...merged.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

export function methodTotals(days: DailySales[]) {
  return days.reduce(
    (total, day) => ({
      cash: total.cash + day.methods.cash,
      transfer: total.transfer + day.methods.transfer,
      counter: total.counter + day.methods.counter,
    }),
    { cash: 0, transfer: 0, counter: 0 },
  );
}

/** ยอดขายเฉลี่ยต่อวันของทุกช่อง (วันในสัปดาห์ × ชั่วโมง) */
export function buildHeatmap(days: DailySales[], firstHour: number, hourCount: number): HeatCell[] {
  const sums = Array.from({ length: 7 }, () => Array<number>(hourCount).fill(0));
  const counts = Array<number>(7).fill(0);

  for (const day of days) {
    const weekday = weekdayIndex(day.date);
    counts[weekday] += 1;
    day.hours.forEach((hour, index) => {
      sums[weekday][index] += hour.revenue;
    });
  }

  return sums.flatMap((row, weekday) =>
    row.map((sum, index) => ({
      weekday,
      hour: firstHour + index,
      average: counts[weekday] > 0 ? Math.round(sum / counts[weekday]) : 0,
    })),
  );
}

export function formatHourRange(hour: number) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(hour)}:00–${pad(hour + 1)}:00 น.`;
}
