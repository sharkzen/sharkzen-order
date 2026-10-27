import { allPermissions } from "../lib/permission-utils";
import type { Role, StaffMember } from "../types";

/**
 * ข้อมูลตัวอย่างสำหรับหน้าพนักงาน (ชื่อและอีเมลเป็นข้อมูลสมมติ)
 * เมื่อมี API ให้แทนที่ด้วยข้อมูลจาก services/ โดยคง type Role และ StaffMember ไว้
 */
export const UPDATED_AT = "14:32 น.";
export const OWNER_ROLE_ID = "owner";

export const ROLES: Role[] = [
  {
    id: OWNER_ROLE_ID,
    name: "เจ้าของร้าน",
    description: "เข้าถึงและทำได้ทุกอย่าง แก้ไขสิทธิ์ไม่ได้",
    builtin: true,
    locked: true,
    permissions: allPermissions(),
  },
  {
    id: "manager",
    name: "ผู้จัดการ",
    description: "ดูแลร้านประจำวัน ดูรายงาน และจัดการทีมงาน",
    builtin: true,
    locked: false,
    permissions: [
      "dashboard.view",
      "orders.view",
      "orders.update_status",
      "orders.payment",
      "orders.cancel",
      "orders.export",
      "cashier.view",
      "cashier.discount",
      "menu.view",
      "menu.edit",
      "menu.availability",
      "tables.view",
      "tables.manage",
      "tables.print",
      "kitchen.view",
      "kitchen.update_status",
      "reports.view",
      "reports.export",
      "staff.view",
      "staff.reset_password",
      "settings.view",
    ],
  },
  {
    id: "cashier",
    name: "แคชเชียร์",
    description: "รับชำระเงินและดูรายการสั่งอาหาร",
    builtin: true,
    locked: false,
    permissions: [
      "dashboard.view",
      "orders.view",
      "orders.payment",
      "cashier.view",
      "tables.view",
      "menu.view",
    ],
  },
  {
    id: "kitchen",
    name: "พ่อครัว",
    description: "ดูออเดอร์ในครัวและเปลี่ยนสถานะการทำอาหาร",
    builtin: true,
    locked: false,
    permissions: [
      "kitchen.view",
      "kitchen.update_status",
      "menu.view",
      "menu.availability",
    ],
  },
  {
    id: "waiter",
    name: "พนักงานเสิร์ฟ",
    description: "รับออเดอร์หน้าร้านและส่งอาหารให้โต๊ะ",
    builtin: true,
    locked: false,
    permissions: [
      "orders.view",
      "orders.update_status",
      "tables.view",
      "kitchen.view",
    ],
  },
];

export const STAFF: StaffMember[] = [
  {
    id: "s-01",
    name: "พิมพ์ชนก",
    username: "owner",
    mustChangePassword: false,
    roleId: OWNER_ROLE_ID,
    status: "active",
    lastActive: "ใช้งานอยู่ตอนนี้",
  },
  {
    id: "s-02",
    name: "ธนากร ใจดี",
    username: "thanakorn",
    mustChangePassword: false,
    roleId: "manager",
    status: "active",
    lastActive: "วันนี้ 14:05 น.",
  },
  {
    id: "s-03",
    name: "ศิริพร สุขสม",
    username: "siriporn",
    mustChangePassword: false,
    roleId: "cashier",
    status: "active",
    lastActive: "วันนี้ 13:48 น.",
  },
  {
    id: "s-04",
    name: "วรเชษฐ์ มั่นคง",
    username: "worachet",
    mustChangePassword: false,
    roleId: "kitchen",
    status: "active",
    lastActive: "วันนี้ 14:30 น.",
  },
  {
    id: "s-05",
    name: "กัญญา เรืองรอง",
    username: "kanya",
    mustChangePassword: false,
    roleId: "waiter",
    status: "active",
    lastActive: "เมื่อวาน 21:12 น.",
  },
  {
    id: "s-06",
    name: "ปกรณ์ แสงทอง",
    username: "pakorn",
    mustChangePassword: true,
    roleId: "waiter",
    status: "active",
    lastActive: "ยังไม่เคยเข้าสู่ระบบ",
  },
  {
    id: "s-07",
    name: "อรอุมา ชัยชนะ",
    username: "onuma",
    mustChangePassword: false,
    roleId: "cashier",
    status: "suspended",
    lastActive: "12 ต.ค. 2569",
  },
];
