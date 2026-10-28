import {
  CircleCheck,
  CircleX,
  Clock,
  HandPlatter,
  RotateCcw,
} from "lucide-react";
import type { ComponentType } from "react";
import { CookingPotIcon } from "@/components/icons/cooking-pot";
import { RingingBellIcon } from "@/components/icons/ringing-bell";
import type { BadgeProps } from "@/components/ui/badge";
import type {
  FoodStatus,
  PaymentFilter,
  PaymentMethod,
  PaymentStatus,
  StatusFilter,
} from "@/features/order-management/types";

type Tone = NonNullable<BadgeProps["tone"]>;

interface BadgeStyle {
  label: string;
  tone: Tone;
  icon: ComponentType<{ className?: string }>;
}

export const FOOD_STATUS_BADGE: Record<FoodStatus, BadgeStyle> = {
  new: { label: "ใหม่", tone: "info", icon: RingingBellIcon },
  preparing: { label: "กำลังทำ", tone: "warning", icon: CookingPotIcon },
  ready: { label: "เสิร์ฟแล้ว", tone: "success", icon: HandPlatter },
  done: { label: "เสร็จสิ้น", tone: "neutral", icon: CircleCheck },
  cancelled: { label: "ยกเลิก", tone: "danger", icon: CircleX },
};

export const PAYMENT_BADGE: Record<PaymentStatus, BadgeStyle> = {
  unpaid: { label: "รอชำระ", tone: "warning", icon: Clock },
  paid: { label: "ชำระแล้ว", tone: "success", icon: CircleCheck },
  refunded: { label: "คืนเงินแล้ว", tone: "danger", icon: RotateCcw },
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "เงินสด",
  transfer: "โอนเงิน",
  counter: "ชำระที่เคาน์เตอร์",
};

/** ลำดับแท็บสถานะ */
export const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "new", label: "ใหม่" },
  { value: "preparing", label: "กำลังทำ" },
  { value: "ready", label: "เสิร์ฟแล้ว" },
  { value: "done", label: "เสร็จสิ้น" },
  { value: "cancelled", label: "ยกเลิก" },
];

export const STATUS_OPTIONS = STATUS_TABS.map(({ value, label }) => ({
  value,
  label: value === "all" ? "ทุกสถานะ" : label,
}));

export const PAYMENT_OPTIONS: { value: PaymentFilter; label: string }[] = [
  { value: "all", label: "การชำระเงินทั้งหมด" },
  { value: "unpaid", label: "รอชำระ" },
  { value: "paid", label: "ชำระแล้ว" },
  { value: "refunded", label: "คืนเงินแล้ว" },
];
