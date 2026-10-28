/** ป้ายราคาแบบไทย เช่น 65.- */
export const price = (value: number) => `${value.toLocaleString("th-TH")}.-`;

export const baht = (value: number) => `${value.toLocaleString("th-TH")} บาท`;

export const STATUS_LABEL = {
  NEW: "รับออเดอร์แล้ว",
  PREPARING: "กำลังทำ",
  READY: "พร้อมเสิร์ฟ",
  SERVED: "เสิร์ฟแล้ว",
  CANCELLED: "ยกเลิก",
} as const;

/** ลำดับสถานะของออเดอร์ปกติ ใช้วาดแถบความคืบหน้า */
export const STATUS_STEPS = ["NEW", "PREPARING", "READY", "SERVED"] as const;

export const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString("th-TH", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
  });
