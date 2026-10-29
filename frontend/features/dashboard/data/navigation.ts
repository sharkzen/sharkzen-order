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
  { label: "ภาพรวมร้านอาหาร", href: ROUTES.dashboard, icon: LayoutDashboard, permission: "dashboard.view" },
  {
    label: "คำสั่งซื้อ",
    href: ROUTES.orders,
    icon: ReceiptText,
    pageTitle: "จัดการคำสั่งซื้อ",
    permission: "orders.view",
  },
  { label: "คิดเงิน", href: ROUTES.cashier, icon: Banknote, permission: "cashier.view" },
  {
    label: "เมนูอาหาร",
    href: ROUTES.menu,
    icon: Utensils,
    pageTitle: "จัดการเมนูอาหาร",
    permission: "menu.view",
  },
  { label: "โต๊ะและคิวอาร์โค้ด", href: ROUTES.tables, icon: QrCode, permission: "tables.view" },
  { label: "หน้าจอครัว", href: ROUTES.kitchen, icon: ChefHat, permission: "kitchen.view" },
  { label: "รายงานยอดขาย", href: ROUTES.reports, icon: ChartNoAxesCombined, permission: "reports.view" },
  { label: "พนักงาน", href: ROUTES.staff, icon: Users, permission: "staff.view" },
  {
    label: "แพ็กเกจ",
    href: ROUTES.plan,
    icon: Gem,
    pageTitle: "แพ็กเกจและการชำระเงิน",
    ownerOnly: true,
  },
  { label: "ตั้งค่าร้าน", href: ROUTES.settings, icon: Settings, permission: "settings.view" },
];
