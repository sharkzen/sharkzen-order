import { clientHttp } from "@/lib/http/client";
import type { OrderStatus } from "@/features/dashboard/types";
import type { DateRange } from "./date-range";

export type ApiOrderStatus =
  "NEW" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";
export type ApiPaymentStatus = "UNPAID" | "PAID";
export type Granularity = "hour" | "day" | "month";

interface PeriodSummary {
  revenue: number;
  orders: number;
  paidOrders: number;
  averageOrder: number;
}

export interface OverviewResponse {
  range: DateRange & { days: number; granularity: Granularity };
  generatedAt: string;
  summary: PeriodSummary;
  previous: PeriodSummary;
  tables: { occupied: number; total: number };
  series: { key: string; amount: number }[];
  statuses: { status: ApiOrderStatus; count: number }[];
  popular: { name: string; quantity: number; revenue: number; image: string }[];
  recent: {
    id: string;
    code: string;
    createdAt: string;
    table: string;
    total: number;
    status: ApiOrderStatus;
  }[];
}

export interface OverviewFilters extends DateRange {
  status?: ApiOrderStatus;
  payment?: ApiPaymentStatus;
}

/** สถานะฝั่ง backend → สถานะที่ใช้แสดงผลในหน้านี้ */
export const STATUS_FROM_API: Record<ApiOrderStatus, OrderStatus> = {
  NEW: "new",
  PREPARING: "preparing",
  READY: "ready",
  SERVED: "done",
  CANCELLED: "cancelled",
};

export const dashboardApi = {
  overview: (filters: OverviewFilters, signal?: AbortSignal) =>
    clientHttp.get<OverviewResponse>("/dashboard/overview", {
      params: filters,
      signal,
    }),
};
