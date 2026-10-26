import { CheckCheck, ConciergeBell, Play } from "lucide-react";
import type { ComponentType } from "react";
import { CookingPotIcon } from "@/components/icons/cooking-pot";
import { RingingBellIcon } from "@/components/icons/ringing-bell";
import type { KitchenStatus } from "../types";

type Icon = ComponentType<{ className?: string }>;

interface ColumnConfig {
  status: KitchenStatus;
  title: string;
  icon: Icon;
  /** สีหัวคอลัมน์ (พื้น + เส้นล่าง) และสีไอคอน */
  headerClassName: string;
  iconClassName: string;
  /** ปุ่มหลักของการ์ดในคอลัมน์นี้ */
  actionLabel: string;
  actionIcon: Icon;
  actionClassName?: string;
  emptyText: string;
}

/** ตั้งค่า 3 คอลัมน์ของกระดานครัว เรียงตามลำดับงาน: ใหม่ → กำลังทำ → พร้อมเสิร์ฟ */
export const COLUMNS: ColumnConfig[] = [
  {
    status: "new",
    title: "ใหม่",
    icon: RingingBellIcon,
    headerClassName: "bg-primary-soft border-primary",
    iconClassName: "text-primary",
    actionLabel: "รับเข้าครัว",
    actionIcon: Play,
    emptyText: "ยังไม่มีออร์เดอร์ใหม่",
  },
  {
    status: "preparing",
    title: "กำลังทำ",
    icon: CookingPotIcon,
    headerClassName: "bg-warning-soft border-warning",
    iconClassName: "text-warning",
    actionLabel: "อาหารพร้อมเสิร์ฟ",
    actionIcon: ConciergeBell,
    emptyText: "ไม่มีงานที่กำลังทำ",
  },
  {
    status: "ready",
    title: "พร้อมเสิร์ฟ",
    icon: ConciergeBell,
    headerClassName: "bg-success-soft border-success",
    iconClassName: "text-success",
    actionLabel: "ยืนยันเสิร์ฟแล้ว",
    actionIcon: CheckCheck,
    actionClassName: "bg-success hover:bg-success-strong",
    emptyText: "ไม่มีงานรอเสิร์ฟ",
  },
];

export const COLUMN_BY_STATUS = Object.fromEntries(
  COLUMNS.map((column) => [column.status, column]),
) as Record<KitchenStatus, ColumnConfig>;
