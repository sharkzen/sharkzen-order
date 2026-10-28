import type { Metadata } from "next";
import { OrdersWorkspace } from "@/features/order-management/components/orders-workspace";

export const metadata: Metadata = { title: "จัดการคำสั่งซื้อ" };

export default function OrdersPage() {
  return <OrdersWorkspace />;
}
