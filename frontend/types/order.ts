export type OrderStatus =
  "pending" | "paid" | "shipped" | "completed" | "cancelled";

export interface Order {
  id: string;
  customerName: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
}
