import { clientHttp } from "@/lib/http/client";
import type {
  FoodStatus,
  ManagedOrder,
  PaymentMethod,
} from "@/features/order-management/types";

type ApiStatus = "NEW" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";

/** ออเดอร์จาก backend (ตรงกับ orderDto) */
export interface ApiOrder {
  id: string;
  code: string;
  createdAt: string;
  table: string;
  zone: string;
  sessionId: string | null;
  status: ApiStatus;
  paymentStatus: "UNPAID" | "PAID";
  paymentMethod: "CASH" | "TRANSFER" | "COUNTER";
  paidAt: string | null;
  total: number;
  notes: string[];
  cancelReason: string | null;
  items: {
    id: string;
    name: string;
    options: { group: string; name: string; price: number }[];
    note: string;
    price: number;
    quantity: number;
    cancelledQty: number;
    cancelReason: string | null;
  }[];
}

const STATUS_FROM_API: Record<ApiStatus, FoodStatus> = {
  NEW: "new",
  PREPARING: "preparing",
  READY: "ready",
  SERVED: "done",
  CANCELLED: "cancelled",
};

export const STATUS_TO_API: Record<Exclude<FoodStatus, "cancelled">, ApiStatus> = {
  new: "NEW",
  preparing: "PREPARING",
  ready: "READY",
  done: "SERVED",
};

const METHOD_FROM_API: Record<ApiOrder["paymentMethod"], PaymentMethod> = {
  CASH: "cash",
  TRANSFER: "transfer",
  COUNTER: "counter",
};

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  timeZone: "Asia/Bangkok",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

const DAY_FORMAT: Intl.DateTimeFormatOptions = { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "2-digit" };

export function toManagedOrder(order: ApiOrder, withDate = false): ManagedOrder {
  return {
    id: order.id,
    code: order.code,
    time: new Date(order.createdAt).toLocaleTimeString("th-TH", TIME_FORMAT),
    ...(withDate && { date: new Date(order.createdAt).toLocaleDateString("th-TH", DAY_FORMAT) }),
    table: order.table,
    items: order.items,
    total: order.total,
    notes: order.notes,
    cancelReason: order.cancelReason,
    paymentStatus: order.paymentStatus === "PAID" ? "paid" : "unpaid",
    paymentMethod: METHOD_FROM_API[order.paymentMethod],
    status: STATUS_FROM_API[order.status],
  };
}

export const ordersApi = {
  list: (date: string, signal?: AbortSignal) =>
    clientHttp
      .get<ApiOrder[]>("/orders", { params: { from: date, to: date }, signal })
      .then((res) => res.data.map((order) => toManagedOrder(order))),

  /** ค้นหาจากรหัสออเดอร์หรือโต๊ะ ข้ามทุกวัน (ล่าสุดก่อน สูงสุด 100 รายการ) */
  search: (q: string, signal?: AbortSignal) =>
    clientHttp
      .get<ApiOrder[]>("/orders", { params: { q }, signal })
      .then((res) => res.data.map((order) => toManagedOrder(order, true))),

  setStatus: (id: string, status: Exclude<FoodStatus, "cancelled">) =>
    clientHttp
      .patch<ApiOrder>(`/orders/${id}/status`, { status: STATUS_TO_API[status] })
      .then((res) => toManagedOrder(res.data)),

  cancel: (id: string, reason: string) =>
    clientHttp
      .post<ApiOrder>(`/orders/${id}/cancel`, { reason })
      .then((res) => toManagedOrder(res.data)),
};
