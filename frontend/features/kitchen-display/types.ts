/** งานที่ครัวต้องดูแล (เสิร์ฟแล้วจะหายออกจากกระดาน) */
export type KitchenStatus = "new" | "preparing" | "ready";

export interface KitchenItem {
  /** รหัสรายการในออเดอร์ ใช้ตอนยกเลิกรายจาน */
  id: string;
  name: string;
  /** ตัวเลือกที่ลูกค้าเลือก เช่น ["เผ็ดน้อย", "ไข่มุก"] */
  options?: string[];
  /** หมายเหตุของรายการนี้จากลูกค้า */
  note?: string;
  quantity: number;
  /** จำนวนที่ครัวยกเลิกไปแล้ว (เช่น วัตถุดิบหมด) ที่เหลือ = quantity - cancelledQty */
  cancelledQty?: number;
  cancelReason?: string;
}

export type PaymentState = "unpaid" | "paid";

/** หน้าร้านยกเลิกคำสั่งซื้อนี้ที่ /orders ครัวต้องกดรับทราบก่อนการ์ดจะหายไป */
export interface FrontCancellation {
  reason: string;
}

export interface KitchenOrder {
  /** รหัสในระบบ ใช้เรียก API */
  id: string;
  /** รหัสที่แสดง เช่น #1042 */
  code: string;
  table: string;
  /** เวลาที่ลูกค้าสั่ง รูปแบบ HH:mm */
  orderedAt: string;
  items: KitchenItem[];
  /** หมายเหตุพิเศษจากลูกค้า เช่น "ส้มตำไม่ใส่ถั่วลิสง" */
  notes: string[];
  /** ยอดรวม (บาท) เก็บไว้ให้หน้าร้านใช้ ไม่แสดงบนหน้าจอครัว */
  total: number;
  payment: { state: PaymentState; method: string };
  status: KitchenStatus;
  /**
   * เวลาที่ออเดอร์เข้าสถานะปัจจุบัน (epoch วินาที จากเซิร์ฟเวอร์)
   * เวลารอ = เวลาปัจจุบัน(วินาที) - since
   */
  since: number;
  /** มีค่า = หน้าร้านยกเลิกแล้ว การ์ดจะค้างเป็นสีแดงให้ครัวกดรับทราบ */
  cancellation?: FrontCancellation;
}
