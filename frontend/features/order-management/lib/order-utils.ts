import type {
  ManagedOrder,
  OrderItem,
  PaymentFilter,
  StatusFilter,
} from "../types";

export const PAGE_SIZE = 10;

/** "ต้มยำกุ้งน้ำข้น × 2, ผัดไทยกุ้งสด" */
export function summarizeItems(items: OrderItem[]) {
  return items
    .map(({ name, quantity }) =>
      quantity > 1 ? `${name} × ${quantity}` : name,
    )
    .join(", ");
}

export function countItems(items: OrderItem[]) {
  return items.reduce((sum, { quantity }) => sum + quantity, 0);
}

interface Filters {
  query: string;
  status: StatusFilter;
  payment: PaymentFilter;
}

export function filterOrders(orders: ManagedOrder[], filters: Filters) {
  const query = filters.query.trim().toLowerCase().replace(/^#/, "");

  return orders.filter((order) => {
    if (filters.status !== "all" && order.status !== filters.status)
      return false;
    if (filters.payment !== "all" && order.paymentStatus !== filters.payment)
      return false;
    if (!query) return true;
    return (
      order.id.toLowerCase().replace("#", "").includes(query) ||
      order.table.includes(query) ||
      order.items.some(({ name }) => name.toLowerCase().includes(query))
    );
  });
}

export function countByStatus(orders: ManagedOrder[]) {
  const counts: Record<StatusFilter, number> = {
    all: orders.length,
    new: 0,
    preparing: 0,
    ready: 0,
    done: 0,
    cancelled: 0,
  };
  for (const { status } of orders) counts[status] += 1;
  return counts;
}
