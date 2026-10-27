import {
  Banknote,
  ChartNoAxesCombined,
  ChefHat,
  LayoutDashboard,
  QrCode,
  ReceiptText,
  Settings,
  Users,
  Utensils,
} from "lucide-react";
import type { ResourceDef } from "../types";

/** แคตตาล็อกสิทธิ์ของทุกหน้า เพิ่มหน้าหรือการกระทำใหม่ที่นี่ที่เดียว ตารางสิทธิ์จะแสดงเองอัตโนมัติ */
export const RESOURCES: ResourceDef[] = [
  {
    id: "dashboard",
    label: "ภาพรวมร้านอาหาร",
    description: "ดูรายได้และสถานะของร้านวันนี้",
    icon: LayoutDashboard,
    actions: [{ id: "view", label: "เข้าหน้านี้ได้" }],
  },
  {
    id: "orders",
    label: "คำสั่งซื้อ",
    description: "รายการสั่งอาหารและการชำระเงิน",
    icon: ReceiptText,
    actions: [
      { id: "view", label: "เข้าหน้านี้ได้" },
      { id: "update_status", label: "เปลี่ยนสถานะอาหาร" },
      { id: "payment", label: "รับชำระเงิน" },
      { id: "cancel", label: "ยกเลิกและคืนเงิน" },
      { id: "export", label: "ส่งออกรายการ" },
    ],
  },
  {
    id: "cashier",
    label: "คิดเงิน",
    description: "รับชำระเงินจากโต๊ะที่ลูกค้าทานเสร็จ",
    icon: Banknote,
    actions: [
      { id: "view", label: "เข้าหน้านี้ได้" },
      { id: "discount", label: "ให้ส่วนลด" },
    ],
  },
  {
    id: "menu",
    label: "เมนูอาหาร",
    description: "ชื่อ ราคา และการเปิดขายเมนู",
    icon: Utensils,
    actions: [
      { id: "view", label: "เข้าหน้านี้ได้" },
      { id: "edit", label: "เพิ่มและแก้ไขเมนู" },
      { id: "availability", label: "เปิด-ปิดขายเมนู" },
      { id: "delete", label: "ลบเมนู" },
    ],
  },
  {
    id: "tables",
    label: "โต๊ะและคิวอาร์โค้ด",
    description: "จัดการโต๊ะและพิมพ์คิวอาร์โค้ด",
    icon: QrCode,
    actions: [
      { id: "view", label: "เข้าหน้านี้ได้" },
      { id: "manage", label: "เพิ่มและแก้ไขโต๊ะ" },
      { id: "print", label: "พิมพ์คิวอาร์โค้ด" },
    ],
  },
  {
    id: "kitchen",
    label: "หน้าจอครัว",
    description: "ออเดอร์ที่ครัวต้องทำ",
    icon: ChefHat,
    actions: [
      { id: "view", label: "เข้าหน้านี้ได้" },
      { id: "update_status", label: "เปลี่ยนสถานะออเดอร์" },
    ],
  },
  {
    id: "reports",
    label: "รายงานยอดขาย",
    description: "ยอดขาย ช่วงเวลาขายดี และเมนูทำเงิน",
    icon: ChartNoAxesCombined,
    actions: [
      { id: "view", label: "เข้าหน้านี้ได้" },
      { id: "export", label: "ส่งออกยอดขาย" },
    ],
  },
  {
    id: "staff",
    label: "พนักงาน",
    description: "ทีมงานและสิทธิ์การใช้งาน",
    icon: Users,
    actions: [
      { id: "view", label: "เข้าหน้านี้ได้" },
      { id: "create", label: "สร้างบัญชีพนักงาน" },
      { id: "manage", label: "แก้ไข ระงับ และลบพนักงาน" },
      { id: "reset_password", label: "รีเซ็ตรหัสผ่านพนักงาน" },
      { id: "roles", label: "จัดการบทบาทและสิทธิ์" },
    ],
  },
  {
    id: "settings",
    label: "ตั้งค่าร้าน",
    description: "ข้อมูลร้าน เวลาเปิด และการชำระเงิน",
    icon: Settings,
    actions: [
      { id: "view", label: "เข้าหน้านี้ได้" },
      { id: "edit", label: "แก้ไขการตั้งค่า" },
    ],
  },
];
