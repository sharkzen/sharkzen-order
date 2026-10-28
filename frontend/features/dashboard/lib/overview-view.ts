import { Armchair, ReceiptText, ShoppingBasket, Wallet } from "lucide-react";
import type {
  Metric,
  OrderStatusCount,
  PopularMenu,
  RecentOrder,
  RevenueSummary,
} from "@/features/dashboard/types";
import { STATUS_FROM_API, type OverviewResponse } from "./dashboard-api";
import { formatNumber } from "./format";
import { formatDay, formatMonth } from "./date-range";

const STATUS_LABEL = {
  new: "ใหม่",
  preparing: "กำลังทำ",
  ready: "เสิร์ฟแล้ว",
  done: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
} as const;

const UNIT_LABEL = { hour: "ชั่วโมง", day: "วัน", month: "เดือน" } as const;
const MAX_AXIS_LABELS = 6;

function changePercent(current: number, previous: number) {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function changeNote(current: number, previous: number, against: string) {
  const change = changePercent(current, previous);
  if (change === null) return `ไม่มีข้อมูล${against}ให้เทียบ`;
  if (change === 0) return `เท่ากับ${against}`;
  return `${change > 0 ? "เพิ่มขึ้น" : "ลดลง"} ${Math.abs(change)}% จาก${against}`;
}

/** ค่าสูงสุดของแกนตั้งที่ปัดให้กลม เช่น 1,730 → 2,000 */
function niceMax(value: number) {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude / 2) * 2 * magnitude;
}

function barLabel(
  key: string,
  granularity: OverviewResponse["range"]["granularity"],
) {
  if (granularity === "hour") return `${key}:00`;
  return granularity === "day" ? formatDay(key) : formatMonth(key);
}

export function toMetrics(
  data: OverviewResponse,
  periodLabel: string,
): Metric[] {
  const { summary, previous, range, tables } = data;
  const against =
    range.days === 1 ? "วันก่อนหน้า" : `${range.days} วันก่อนหน้า`;
  const free = Math.max(tables.total - tables.occupied, 0);
  const usage = tables.total
    ? Math.round((tables.occupied / tables.total) * 100)
    : 0;

  return [
    {
      id: "revenue",
      label: `รายได้${periodLabel}`,
      value: `฿ ${formatNumber(Math.round(summary.revenue))}`,
      note: changeNote(summary.revenue, previous.revenue, against),
      icon: Wallet,
      tone: "primary",
    },
    {
      id: "orders",
      label: "คำสั่งซื้อทั้งหมด",
      value: formatNumber(summary.orders),
      note: changeNote(summary.orders, previous.orders, against),
      icon: ReceiptText,
      tone: "success",
    },
    {
      id: "average",
      label: "ยอดเฉลี่ยต่อคำสั่งซื้อ",
      value: `฿ ${formatNumber(Math.round(summary.averageOrder))}`,
      note: changeNote(summary.averageOrder, previous.averageOrder, against),
      icon: ShoppingBasket,
      tone: "warning",
    },
    {
      id: "tables",
      label: "โต๊ะที่มีลูกค้า (ตอนนี้)",
      value: `${tables.occupied} / ${tables.total}`,
      note: `ว่าง ${free} โต๊ะ • ใช้งานอยู่ ${usage}%`,
      icon: Armchair,
      tone: "primary",
    },
  ];
}

export function toRevenue(
  data: OverviewResponse,
  updatedAt: string,
): RevenueSummary {
  const { series, range, summary, previous } = data;
  const bars = series.map(({ key, amount }) => ({
    time: barLabel(key, range.granularity),
    amount,
  }));
  const step = Math.max(1, Math.ceil(bars.length / MAX_AXIS_LABELS));
  const timeLabels = bars
    .filter((_, index) => index % step === 0)
    .map((bar) => bar.time);

  return {
    total: summary.revenue,
    changePercent: changePercent(summary.revenue, previous.revenue),
    axisMax: niceMax(Math.max(0, ...bars.map((bar) => bar.amount))),
    bars,
    timeLabels,
    unitLabel: UNIT_LABEL[range.granularity],
    updatedAt,
  };
}

export function toStatuses(data: OverviewResponse): OrderStatusCount[] {
  return data.statuses.map(({ status, count }) => {
    const mapped = STATUS_FROM_API[status];
    return { status: mapped, label: STATUS_LABEL[mapped], count };
  });
}

export function toPopular(data: OverviewResponse): PopularMenu[] {
  return data.popular;
}

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  timeZone: "Asia/Bangkok",
  hour: "2-digit",
  minute: "2-digit",
};

export function toRecent(data: OverviewResponse): RecentOrder[] {
  const multiDay = data.range.days > 1;
  return data.recent.map((order) => {
    const date = new Date(order.createdAt);
    const time = `${date.toLocaleTimeString("th-TH", TIME_FORMAT)} น.`;
    const day = date.toLocaleDateString("th-TH", {
      timeZone: "Asia/Bangkok",
      day: "numeric",
      month: "short",
    });
    return {
      id: `#${order.number}`,
      time: multiDay ? `${day} ${time}` : time,
      table: order.table,
      total: order.total,
      status: STATUS_FROM_API[order.status],
    };
  });
}
