import type { LucideIcon } from "lucide-react";

/** หน้าในระบบที่กำหนดสิทธิ์ได้ (ตรงกับเมนูแถบข้าง) */
export type ResourceId =
  | "dashboard"
  | "orders"
  | "cashier"
  | "menu"
  | "tables"
  | "kitchen"
  | "reports"
  | "staff"
  | "settings";

/** รหัสสิทธิ์รูปแบบ "<หน้า>.<การกระทำ>" เช่น "orders.cancel" */
export type PermissionKey = string;

export interface PermissionAction {
  id: string;
  label: string;
}

export interface ResourceDef {
  id: ResourceId;
  label: string;
  description: string;
  icon: LucideIcon;
  /** การกระทำแรกต้องเป็น "view" (เข้าหน้านี้ได้) เสมอ */
  actions: PermissionAction[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  /** บทบาทตั้งต้นของระบบ ลบไม่ได้ */
  builtin: boolean;
  /** ล็อกสิทธิ์ทั้งหมด แก้ไม่ได้ (เจ้าของร้าน) */
  locked: boolean;
  permissions: PermissionKey[];
}

export type StaffStatus = "active" | "suspended";

export interface StaffMember {
  id: string;
  name: string;
  /** ชื่อผู้ใช้สำหรับเข้าสู่ระบบ (เจ้าของร้านเป็นคนตั้งให้) */
  username: string;
  /** รหัสผ่านที่เจ้าของร้านตั้งหรือรีเซ็ตให้ ต้องเปลี่ยนเองเมื่อเข้าสู่ระบบครั้งแรก */
  mustChangePassword: boolean;
  roleId: string;
  status: StaffStatus;
  /** ข้อความแสดงการเข้าใช้งานล่าสุด */
  lastActive: string;
}
