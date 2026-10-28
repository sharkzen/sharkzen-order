import { clientHttp } from "@/lib/http/client";
import type { DailySales, RangeDays } from "@/features/reports/types";

interface ApiReport {
  generatedAt: string;
  days: {
    date: string;
    hours: { revenue: number; orders: number }[];
    menu: { name: string; quantity: number; revenue: number }[];
    methods: DailySales["methods"];
  }[];
}

export interface ReportData {
  days: DailySales[];
  /** ช่วงชั่วโมงที่แสดงในตารางความร้อน (ตามชั่วโมงที่มียอดขายจริง อย่างน้อย 8 ชั่วโมง) */
  firstHour: number;
  hourCount: number;
  generatedAt: string;
}

const DEFAULT_WINDOW = { first: 10, last: 21 };
const MIN_HOURS = 8;

/** หาช่วงชั่วโมงที่ครอบคลุมยอดขายทั้งหมด (ไม่มียอดเลยใช้ 10:00–22:00) แล้วขยายให้ไม่แคบเกินไป */
function hourWindow(days: ApiReport["days"]) {
  const active = days.flatMap((day) =>
    day.hours.flatMap((hour, index) => (hour.revenue > 0 || hour.orders > 0 ? [index] : [])),
  );
  let first = active.length ? Math.min(...active) : DEFAULT_WINDOW.first;
  let last = active.length ? Math.max(...active) : DEFAULT_WINDOW.last;
  while (last - first + 1 < MIN_HOURS) {
    if (first > 0) first -= 1;
    if (last - first + 1 < MIN_HOURS && last < 23) last += 1;
  }
  return { first, count: last - first + 1 };
}

export const reportsApi = {
  /** ขอข้อมูล 2 เท่าของช่วงที่ดู เพื่อเทียบกับช่วงก่อนหน้า */
  sales: (range: RangeDays, signal?: AbortSignal): Promise<ReportData> =>
    clientHttp
      .get<ApiReport>("/reports/sales", { params: { days: range * 2 }, signal })
      .then(({ data }) => {
        const { first, count } = hourWindow(data.days);
        return {
          generatedAt: data.generatedAt,
          firstHour: first,
          hourCount: count,
          days: data.days.map((day) => ({
            date: day.date,
            hours: day.hours.slice(first, first + count),
            menu: day.menu,
            methods: day.methods,
          })),
        };
      }),
};
