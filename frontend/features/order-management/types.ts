/** สถานะอาหารของคำสั่งซื้อ (ตรงกับแท็บสถานะในหน้าจัดการ) */
export type FoodStatus = "new" | "preparing" | "ready" | "done" | "cancelled";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

/** ช่องทางชำระเงิน: counter = ลูกค้าเลือกชำระที่เคาน์เตอร์ (ยังไม่ได้ชำระ) */
export type PaymentMethod = "cash" | "transfer" | "counter";

export interface OrderItem {
  name: string;
  quantity: number;
}

export interface ManagedOrder {
  id: string;
  /** เวลาที่สั่ง รูปแบบ HH:mm */
  time: string;
  table: string;
  items: OrderItem[];
  total: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  status: FoodStatus;
}

export type StatusFilter = FoodStatus | "all";
export type PaymentFilter = PaymentStatus | "all";
