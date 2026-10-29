import { clientHttp } from "@/lib/http/client";
import type { KitchenOrder, KitchenStatus } from "@/features/kitchen-display/types";

type ApiStatus = "NEW" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";

/** ออเดอร์จาก backend (ตรงกับ orderDto) เฉพาะฟิลด์ที่ครัวใช้ */
export interface ApiKitchenOrder {
  id: string;
  code: string;
  createdAt: string;
  table: string;
  status: ApiStatus;
  paymentStatus: "UNPAID" | "PAID";
  paymentMethod: "CASH" | "TRANSFER" | "COUNTER";
  total: number;
  notes: string[];
  cancelReason: string | null;
  statusChangedAt: string;
  kitchenAck: boolean;
  items: {
    id: string;
    name: string;
    options: { group: string; name: string; price: number }[];
    note: string;
    quantity: number;
    cancelledQty: number;
    cancelReason: string | null;
  }[];
}

const METHOD_LABEL = { CASH: "เงินสด", TRANSFER: "โอนเงิน", COUNTER: "ชำระที่เคาน์เตอร์" } as const;

const CLOCK: Intl.DateTimeFormatOptions = { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", hour12: false };

const KITCHEN_STATUS: Partial<Record<ApiStatus, KitchenStatus>> = {
  NEW: "new",
  PREPARING: "preparing",
  READY: "ready",
};

/** ชื่อโต๊ะที่ตัดคำนำหน้า "โต๊ะ" ออก เพราะหน้าจอครัวเติมคำว่า "โต๊ะ" เอง */
const tableLabel = (name: string) => name.replace(/^โต๊ะ\s*/, "") || name;

/**
 * แปลงออเดอร์เป็นงานของครัว
 * - ออเดอร์ที่ถูกยกเลิกและครัวยังไม่รับทราบ → การ์ดสีแดง (cancellation) ค้างอยู่ในคอลัมน์ที่มันอยู่ล่าสุด
 * - ออเดอร์ที่เสิร์ฟแล้ว หรือยกเลิกและรับทราบแล้ว ไม่แสดง
 */
export function toKitchenOrder(order: ApiKitchenOrder): KitchenOrder | null {
  const cancelled = order.status === "CANCELLED";
  if (cancelled && order.kitchenAck) return null;
  const status = cancelled ? "new" : KITCHEN_STATUS[order.status];
  if (!status) return null;

  return {
    id: order.id,
    code: order.code,
    table: tableLabel(order.table),
    orderedAt: new Date(order.createdAt).toLocaleTimeString("th-TH", CLOCK),
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      options: item.options.map((option) => option.name),
      ...(item.note && { note: item.note }),
      quantity: item.quantity,
      cancelledQty: item.cancelledQty,
      ...(item.cancelReason && { cancelReason: item.cancelReason }),
    })),
    notes: order.notes,
    total: order.total,
    payment: { state: order.paymentStatus === "PAID" ? "paid" : "unpaid", method: METHOD_LABEL[order.paymentMethod] },
    status,
    since: Math.floor(new Date(order.statusChangedAt).getTime() / 1000),
    ...(cancelled && { cancellation: { reason: order.cancelReason ?? "หน้าร้านยกเลิก" } }),
  };
}

const NEXT_API_STATUS: Record<KitchenStatus, ApiStatus> = {
  new: "PREPARING",
  preparing: "READY",
  ready: "SERVED",
};

export const kitchenApi = {
  list: (signal?: AbortSignal) =>
    clientHttp
      .get<ApiKitchenOrder[]>("/orders", { params: { kitchen: true }, signal })
      .then((res) => res.data.flatMap((order) => toKitchenOrder(order) ?? [])),

  /** เลื่อนสถานะไปขั้นถัดไป (พร้อมเสิร์ฟ → เสิร์ฟแล้ว = หายจากกระดาน) */
  advance: (order: KitchenOrder) =>
    clientHttp.patch(`/orders/${order.id}/status`, { status: NEXT_API_STATUS[order.status] }),

  /** ครัวยกเลิกทั้งออเดอร์ (ออเดอร์ที่ชำระแล้วก็ยกเลิกได้ หน้าร้านต้องคืนเงิน) */
  cancelOrder: (order: KitchenOrder, reason: string) =>
    clientHttp.post(`/orders/${order.id}/cancel`, { reason, fromKitchen: true }),

  cancelItem: (order: KitchenOrder, itemId: string, quantity: number, reason: string) =>
    clientHttp.post(`/orders/${order.id}/items/${itemId}/cancel`, { quantity, reason, fromKitchen: true }),

  /** รับทราบว่าหน้าร้านยกเลิกแล้ว (การ์ดแดงหายไป) */
  acknowledge: (order: KitchenOrder) => clientHttp.post(`/orders/${order.id}/ack-cancel`),
};

/** ออเดอร์จาก socket (payload ของ order:created / order:updated) */
export type { ApiKitchenOrder as SocketOrder };
