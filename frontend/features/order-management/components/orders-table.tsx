import type { ManagedOrder } from "@/features/order-management/types";
import { ORDER_GRID, OrderRow } from "./order-row";

const COLUMNS = [
  "คำสั่งซื้อ",
  "เวลา",
  "โต๊ะ",
  "รายการอาหาร",
  "ยอดรวม",
  "การชำระเงิน",
  "สถานะอาหาร",
  "จัดการ",
];

/** รายการคำสั่งซื้อของหน้านั้น: หัวตารางแสดงเฉพาะจอใหญ่ จอเล็กเป็นการ์ด */
export function OrdersTable({ orders, onView }: { orders: ManagedOrder[]; onView: (order: ManagedOrder) => void }) {
  return (
    <div>
      <div
        aria-hidden
        className={`bg-background text-muted-foreground hidden px-5 py-4 text-xs font-medium ${ORDER_GRID}`}
      >
        {COLUMNS.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      <ul>
        {orders.map((order) => (
          <OrderRow key={order.id} order={order} onView={onView} />
        ))}
      </ul>
    </div>
  );
}
