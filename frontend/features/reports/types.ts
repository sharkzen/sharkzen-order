import type { PaymentMethod } from "@/features/order-management/types";

/** จำนวนวันของช่วงเวลาที่เลือกดูรายงาน */
export type RangeDays = 7 | 14 | 30;

export interface HourSales {
  revenue: number;
  orders: number;
}

/** ยอดขายหนึ่งวัน แยกรายชั่วโมงเปิดร้าน ตามเมนู และตามช่องทางชำระเงิน */
export interface DailySales {
  /** วันที่รูปแบบ YYYY-MM-DD */
  date: string;
  /** เรียงตามชั่วโมงเปิดร้านเริ่มจากชั่วโมงแรก (HOURS) */
  hours: HourSales[];
  /** จำนวนจานที่ขายได้ ลำดับเดียวกับ MENU_ITEMS */
  menu: number[];
  methods: Record<PaymentMethod, number>;
}

export interface MenuItemInfo {
  name: string;
  price: number;
}

export interface PeriodSummary {
  revenue: number;
  orders: number;
  average: number;
  /** จำนวนจานที่ขายทั้งหมด */
  dishes: number;
}

export interface TopMenu {
  name: string;
  quantity: number;
  revenue: number;
}

export interface HeatCell {
  /** 0 = จันทร์ ... 6 = อาทิตย์ */
  weekday: number;
  hour: number;
  /** ยอดขายเฉลี่ยต่อวันของช่องนี้ (บาท) */
  average: number;
}
