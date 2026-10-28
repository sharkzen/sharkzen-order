import {
  Banknote,
  ChartNoAxesCombined,
  ChefHat,
  Gem,
  LayoutDashboard,
  QrCode,
  ReceiptText,
  Settings,
  Users,
  Utensils,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import type { NavItem } from "@/features/dashboard/types";

export const SIDEBAR_NAV: NavItem[] = [
  { label: "ภาพรวมร้านอาหาร", href: ROUTES.dashboard, icon: LayoutDashboard },
  {
    label: "คำสั่งซื้อ",
    href: ROUTES.orders,
    icon: ReceiptText,
    pageTitle: "จัดการคำสั่งซื้อ",
  },
  { label: "คิดเงิน", href: ROUTES.cashier, icon: Banknote },
  {
    label: "เมนูอาหาร",
    href: ROUTES.menu,
    icon: Utensils,
    pageTitle: "จัดการเมนูอาหาร",
  },
  { label: "โต๊ะและคิวอาร์โค้ด", href: ROUTES.tables, icon: QrCode },
  { label: "หน้าจอครัว", href: ROUTES.kitchen, icon: ChefHat },
  { label: "รายงานยอดขาย", href: ROUTES.reports, icon: ChartNoAxesCombined },
  { label: "พนักงาน", href: ROUTES.staff, icon: Users },
  {
    label: "แพ็กเกจ",
    href: ROUTES.plan,
    icon: Gem,
    pageTitle: "แพ็กเกจและการชำระเงิน",
  },
  { label: "ตั้งค่าร้าน", href: ROUTES.settings, icon: Settings },
];
