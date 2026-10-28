import type { Metadata } from "next";
import { KitchenScreen } from "@/features/kitchen-display/components/kitchen-screen";
import { StaffCallListener } from "@/features/staff-call/components/staff-call-listener";

export const metadata: Metadata = { title: "หน้าจอครัว" };

// หน้าจอครัวเต็มพื้นที่ ไม่มีแถบนำทางร้าน จึงอยู่ในกลุ่ม (kitchen) แยกจาก (dashboard)
export default function KitchenPage() {
  return (
    <>
      <StaffCallListener />
      <KitchenScreen />
    </>
  );
}
