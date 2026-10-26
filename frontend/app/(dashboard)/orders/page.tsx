import type { Metadata } from "next";
import { OrdersWorkspace } from "@/features/order-management/components/orders-workspace";
import { ORDERS } from "@/features/order-management/data/orders";

export const metadata: Metadata = { title: "จัดการคำสั่งซื้อ" };

export default function OrdersPage() {
  return <OrdersWorkspace orders={ORDERS} />;
}
