import type { SubStatus } from "./admin-api";

export const baht = (amount: number) => `฿${Math.round(amount).toLocaleString("en-US")}`;

const TZ = "Asia/Bangkok";

export const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit", timeZone: TZ })
    : "-";

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });

/** วันที่คงเหลือ (ปัดขึ้น) ติดลบ = เลยกำหนดแล้ว */
export const daysLeft = (iso: string | null) =>
  iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000) : null;

export function countdownLabel(iso: string | null) {
  const days = daysLeft(iso);
  if (days === null) return "-";
  if (days < 0) return `เลยมา ${-days} วัน`;
  if (days === 0) return "หมดวันนี้";
  return `เหลือ ${days} วัน`;
}

/** yyyy-mm-dd ตามเวลาไทย สำหรับ input แบบ date */
export const toDateInput = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ }) : "";

/** วันที่จาก input แบบ date เป็น ISO สิ้นวันตามเวลาไทย ("" = ไม่มี) */
export const fromDateInput = (value: string) => (value ? new Date(`${value}T23:59:59+07:00`).toISOString() : null);

export const STATUS_LABEL: Record<SubStatus, string> = {
  TRIALING: "ทดลองใช้",
  ACTIVE: "ใช้งานอยู่",
  PAST_DUE: "ค้างชำระ",
  CANCELED: "ยกเลิก/หมดอายุ",
};

export const STATUS_TONE: Record<SubStatus, "info" | "success" | "warning" | "neutral"> = {
  TRIALING: "info",
  ACTIVE: "success",
  PAST_DUE: "warning",
  CANCELED: "neutral",
};

export const ACTION_LABEL: Record<string, string> = {
  "user.ban": "แบนผู้ใช้",
  "user.unban": "ปลดแบนผู้ใช้",
  "subscription.update": "แก้ไขแพ็กเกจผู้ใช้",
  "shop.suspend": "ระงับร้าน",
  "shop.unsuspend": "ปลดระงับร้าน",
  "plan.create": "สร้างแพ็กเกจ",
  "plan.update": "แก้ไขแพ็กเกจ",
  "plan.delete": "ลบแพ็กเกจ",
  "settings.update": "แก้ตั้งค่าระบบ",
};

export const limitLabel = (value: number | null, unit: string) =>
  value === null ? "ไม่จำกัด" : `${value.toLocaleString("en-US")} ${unit}`;
