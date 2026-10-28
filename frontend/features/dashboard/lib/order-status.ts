import { CircleCheck, CircleX, HandPlatter } from "lucide-react";
import type { ComponentType } from "react";
import { CookingPotIcon } from "@/components/icons/cooking-pot";
import { RingingBellIcon } from "@/components/icons/ringing-bell";
import type { BadgeProps } from "@/components/ui/badge";
import type { OrderStatus } from "@/features/dashboard/types";

/** สีของแต่ละสถานะ ใช้ร่วมกันระหว่างแผนภูมิวงแหวนและคำอธิบาย (ผ่าน currentColor) */
export const STATUS_COLOR: Record<OrderStatus, string> = {
  new: "text-primary",
  preparing: "text-warning",
  ready: "text-blue-400",
  done: "text-success",
  cancelled: "text-danger",
};

/** ป้ายสถานะในตารางคำสั่งซื้อ */
export const STATUS_BADGE: Record<
  OrderStatus,
  {
    label: string;
    tone: NonNullable<BadgeProps["tone"]>;
    icon: ComponentType<{ className?: string }>;
  }
> = {
  new: { label: "ใหม่", tone: "info", icon: RingingBellIcon },
  preparing: { label: "กำลังทำ", tone: "warning", icon: CookingPotIcon },
  ready: { label: "เสิร์ฟแล้ว", tone: "success", icon: HandPlatter },
  done: { label: "เสร็จสิ้น", tone: "success", icon: CircleCheck },
  cancelled: { label: "ยกเลิก", tone: "danger", icon: CircleX },
};
