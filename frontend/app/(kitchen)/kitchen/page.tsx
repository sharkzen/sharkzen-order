import type { Metadata } from "next";
import { KitchenBoard } from "@/features/kitchen-display/components/kitchen-board";
import { KITCHEN_ORDERS } from "@/features/kitchen-display/data/kitchen-orders";

export const metadata: Metadata = { title: "หน้าจอครัว" };

// หน้าจอครัวเต็มพื้นที่ ไม่มีแถบนำทางร้าน จึงอยู่ในกลุ่ม (kitchen) แยกจาก (dashboard)
export default function KitchenPage() {
  return <KitchenBoard initialOrders={KITCHEN_ORDERS} />;
}
