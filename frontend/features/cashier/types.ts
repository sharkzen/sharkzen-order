export interface BillLine {
  name: string;
  quantity: number;
  /** ราคาต่อหน่วย (บาท) ณ เวลาที่สั่ง */
  unitPrice: number;
}

/** คำสั่งซื้อหนึ่งรอบของโต๊ะ (ลูกค้าโต๊ะเดียวกันสั่งได้หลายรอบ) */
export interface BillRound {
  orderId: string;
  /** เวลาที่สั่ง HH:mm */
  time: string;
  lines: BillLine[];
  /** ครัวทำเสร็จและเสิร์ฟครบแล้วหรือยัง */
  served: boolean;
}

export type CheckoutMethod = "cash" | "transfer";

export interface Payment {
  method: CheckoutMethod;
  /** เวลาที่รับชำระ HH:mm */
  paidAt: string;
  subtotal: number;
  discount: number;
  serviceCharge: number;
  total: number;
  /** เงินสดที่รับมา (เฉพาะชำระเงินสด) */
  received?: number;
  change?: number;
}

/** บิลของโต๊ะที่เปิดอยู่ รวมทุกรอบที่สั่ง */
export interface TableBill {
  tableId: string;
  tableName: string;
  zone: string;
  /** เวลาเปิดโต๊ะ HH:mm */
  openedAt: string;
  rounds: BillRound[];
  /** มีค่า = ชำระแล้ว รอปิดโต๊ะ */
  payment: Payment | null;
}

/** ค่าจากหน้าตั้งค่าร้านที่เกี่ยวกับการคิดเงิน */
export interface CheckoutConfig {
  serviceChargePercent: number;
  vatIncluded: boolean;
  promptPayId: string;
  shopName: string;
  /** ข้อมูลร้านสำหรับหัวใบเสร็จ */
  branch: string;
  phone: string;
  address: string;
}

export interface BillTotals {
  subtotal: number;
  discount: number;
  serviceCharge: number;
  total: number;
  /** ภาษีมูลค่าเพิ่ม 7% ที่รวมอยู่ในยอดสุทธิแล้ว (แสดงให้ดูเท่านั้น) */
  vatIncluded: number;
  dishCount: number;
}

/** ทางเลือกหลังรับชำระ: พิมพ์ใบเสร็จแล้วปิดโต๊ะ / พิมพ์อย่างเดียวไม่ปิดโต๊ะ / ปิดโต๊ะเลยไม่พิมพ์ */
export type FinishAction = "print-close" | "print-only" | "close-only";
