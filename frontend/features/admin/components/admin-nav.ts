import { Gem, LayoutDashboard, Settings, Store, Users, type LucideIcon } from "lucide-react";
import { ROUTES } from "@/constants/routes";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** หัวข้อบนแถบบน */
  title: string;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { label: "ภาพรวมระบบ", href: ROUTES.admin, icon: LayoutDashboard, title: "ภาพรวมระบบ" },
  { label: "ผู้ใช้งาน", href: ROUTES.adminUsers, icon: Users, title: "จัดการผู้ใช้งาน" },
  { label: "ร้านค้า", href: ROUTES.adminShops, icon: Store, title: "จัดการร้านค้า" },
  { label: "แพ็กเกจและราคา", href: ROUTES.adminPlans, icon: Gem, title: "แพ็กเกจและราคา" },
  { label: "ตั้งค่าและบันทึก", href: ROUTES.adminSettings, icon: Settings, title: "ตั้งค่าระบบและบันทึกการทำงาน" },
];

/** หน้าแรก (/admin) ต้องตรงทั้งหมด ส่วนหน้าอื่นนับเมื่อ URL ขึ้นต้นด้วย path นั้น */
export const isActiveNav = (pathname: string, href: string) =>
  href === ROUTES.admin ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
