import type { LucideIcon } from "lucide-react";

export type Tone = "primary" | "success" | "warning" | "danger";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** จำนวนงานที่รอดำเนินการ แสดงเป็นป้ายท้ายรายการ */
  count?: number;
  /** ชื่อหน้าในเส้นทางหน้า ถ้าต่างจากชื่อเมนู */
  pageTitle?: string;
}

export interface Metric {
  id: string;
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone: Tone;
}

export interface RevenueBar {
  /** ป้ายของช่วง เช่น "13:00" (รายชั่วโมง), "24 ต.ค." (รายวัน), "ต.ค. 69" (รายเดือน) */
  time: string;
  /** รายได้ในช่วงนั้น (บาท) */
  amount: number;
}

export interface RevenueSummary {
  total: number;
  /** null เมื่อช่วงก่อนหน้าไม่มียอดให้เทียบ */
  changePercent: number | null;
  /** ค่าสูงสุดของแกนตั้ง */
  axisMax: number;
  bars: RevenueBar[];
  /** ป้ายแกนเวลาใต้กราฟ */
  timeLabels: string[];
  /** หน่วยของแต่ละแท่ง เช่น "ชั่วโมง" "วัน" "เดือน" */
  unitLabel: string;
  updatedAt: string;
}

export type OrderStatus = "new" | "preparing" | "ready" | "done" | "cancelled";

export interface OrderStatusCount {
  status: OrderStatus;
  label: string;
  count: number;
}

export interface PopularMenu {
  name: string;
  quantity: number;
  revenue: number;
}

export interface RecentOrder {
  id: string;
  time: string;
  table: string;
  total: number;
  status: OrderStatus;
}

export interface ShopInfo {
  name: string;
  branch: string;
  isOpen: boolean;
  hours: string;
  phone: string;
}

export interface Account {
  name: string;
  role: string;
  initial: string;
}
