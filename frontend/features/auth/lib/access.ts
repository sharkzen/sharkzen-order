import { ROUTES } from "@/constants/routes";
import { SIDEBAR_NAV } from "@/features/dashboard/data/navigation";
import type { NavItem } from "@/features/dashboard/types";
import type { SessionUser } from "./auth-api";

/**
 * ผู้ใช้เปิดเมนู/หน้านี้ได้หรือไม่ (ฝั่งหน้าจอ เพื่อซ่อนสิ่งที่ใช้ไม่ได้ ตัวบังคับจริงอยู่ที่ backend)
 * เจ้าของร้านและผู้ดูแลระบบไม่มี permissions = ทำได้ทุกอย่าง
 */
export function canAccess(user: SessionUser | undefined, item: Pick<NavItem, "permission" | "ownerOnly">) {
  if (!user || user.permissions === undefined) return true;
  if (item.ownerOnly) return false;
  return !item.permission || user.permissions.includes(item.permission);
}

/** หน้าแรกหลังเข้าสู่ระบบ: ผู้ดูแล → /admin, พนักงาน → หน้าแรกที่บทบาทมีสิทธิ์ */
export function homeFor(user: SessionUser | undefined) {
  if (user?.role === "ADMIN") return ROUTES.admin;
  const first = SIDEBAR_NAV.find((item) => canAccess(user, item));
  return first?.href ?? ROUTES.dashboard;
}
