/** สถานะอาหารของคำสั่งซื้อ (ตรงกับแท็บสถานะในหน้าจัดการ) */
export type FoodStatus = "new" | "preparing" | "ready" | "done" | "cancelled";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

/** ช่องทางชำระเงิน: counter = ลูกค้าเลือกชำระที่เคาน์เตอร์ (ยังไม่ได้ชำระ) */
export type PaymentMethod = "cash" | "transfer" | "counter";

export interface OrderItem {
  id: string;
  name: string;
  /** ตัวเลือกที่ลูกค้าเลือก (ราคาต่อหน่วยรวมตัวเลือกแล้ว) */
  options: { group: string; name: string; price: number }[];
  /** หมายเหตุของรายการนี้จากลูกค้า */
  note: string;
  /** ราคาต่อหน่วย (บาท) */
  price: number;
  quantity: number;
  /** จำนวนที่ถูกยกเลิกไปแล้ว ที่เหลือ = quantity - cancelledQty */
  cancelledQty: number;
  cancelReason: string | null;
}

export interface ManagedOrder {
  /** รหัสในระบบ ใช้เรียก API */
  id: string;
  /** รหัสที่แสดง เช่น #1042 */
  code: string;
  /** เวลาที่สั่ง รูปแบบ HH:mm */
  time: string;
  /** วันที่สั่ง (มีเฉพาะผลค้นหาข้ามวัน) เช่น "29 ต.ค." */
  date?: string;
  table: string;
  items: OrderItem[];
  total: number;
  notes: string[];
  cancelReason: string | null;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  status: FoodStatus;
}

export type StatusFilter = FoodStatus | "all";
export type PaymentFilter = PaymentStatus | "all";
