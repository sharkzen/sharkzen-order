import type { Account, ShopInfo } from "@/features/dashboard/types";

/**
 * ข้อมูลตัวอย่างของบัญชี/ร้าน (ชื่อร้านเป็นข้อมูลสมมติ) ยังไม่มี API สำหรับข้อมูลร้าน
 * ส่วนตัวเลขภาพรวมทั้งหมดดึงจาก backend ผ่าน lib/dashboard-api.ts
 */
export const ACCOUNT: Account = {
  name: "พิมพ์ชนก",
  role: "เจ้าของร้าน",
  initial: "พ",
};

export const SHOP: ShopInfo = {
  name: "ครัวริมทะเล",
  branch: "สาขาหาดเจ้าสำราญ",
  isOpen: true,
  hours: "เปิดทุกวัน 10:00–22:00 น.",
  phone: "032-123-456",
};

export const PLAN = { name: "เติบโต", validUntil: "30 พฤศจิกายน 2569" };
