import { BellRing } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * กระดิ่งที่สั่นเป็นระยะ ใช้กับสถานะ "ใหม่" และแจ้งเตือนออร์เดอร์ใหม่
 * สั่นด้วย CSS (.bell-ring ใน globals.css) และหยุดเมื่อผู้ใช้ตั้งค่าลดการเคลื่อนไหว
 */
export function RingingBellIcon({ className }: { className?: string }) {
  return <BellRing className={cn("bell-ring", className)} aria-hidden />;
}
