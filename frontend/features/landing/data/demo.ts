import type { IconType } from "react-icons";
import { BsQrCode } from "react-icons/bs";
import {
  FaBuildingColumns,
  FaCreditCard,
  FaMoneyBill1Wave,
} from "react-icons/fa6";

/** ข้อมูลตัวอย่างสำหรับหน้าแนะนำระบบ — ชื่อร้านเป็นชื่อสมมติ ไม่ได้อ้างอิงร้านจริง */
export const DEMO_RESTAURANT = {
  name: "ครัวตัวอย่าง",
  branch: "สาขาสาธิต",
} as const;
export const DEMO_TABLE = "โต๊ะ 05";

export const DEMO_ORDER_ITEMS = [
  {
    name: "ข้าวกะเพราหมูสับไข่ดาว",
    price: 75,
    image: "/images/landing/menu-krapao.jpg",
  },
  {
    name: "ผัดไทยกุ้งสด",
    price: 95,
    image: "/images/landing/menu-padthai.jpg",
  },
  {
    name: "ต้มยำกุ้งน้ำข้น",
    price: 120,
    image: "/images/landing/menu-tomyum.jpg",
  },
] as const;

export const DEMO_ORDER_TOTAL = DEMO_ORDER_ITEMS.reduce(
  (sum, item) => sum + item.price,
  0,
);

/** ลำดับเหตุการณ์ของตัวอย่างโต๊ะ 05 ในส่วน Hero */
export const DEMO_STAGES = [
  "ลูกค้าเลือกเมนู",
  "ส่งถึงครัว",
  "ครัวกำลังทำ",
  "พร้อมเสิร์ฟ",
  "ชำระเงินแล้ว",
] as const;
export const DEMO_LAST_STAGE = DEMO_STAGES.length - 1;

export interface PaymentMethod {
  id: string;
  label: string;
  icon: IconType;
  amount: number;
}

/** ยอดรวมทุกช่องทาง = 12,480 บาท (ตรงกับรายได้วันนี้ในภาพจำลอง dashboard) */
export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "promptpay", label: "พร้อมเพย์", icon: BsQrCode, amount: 7240 },
  { id: "cash", label: "เงินสด", icon: FaMoneyBill1Wave, amount: 2990 },
  { id: "card", label: "บัตรเครดิต/เดบิต", icon: FaCreditCard, amount: 1750 },
  {
    id: "transfer",
    label: "โอนผ่านธนาคาร",
    icon: FaBuildingColumns,
    amount: 500,
  },
];

export const DAILY_REVENUE = PAYMENT_METHODS.reduce(
  (sum, m) => sum + m.amount,
  0,
);

export const DASHBOARD_METRICS = [
  {
    label: "รายได้วันนี้",
    value: "฿ 12,480",
    note: "เพิ่มขึ้น 12.8% จากเมื่อวาน",
  },
  {
    label: "คำสั่งซื้อทั้งหมด",
    value: "48",
    note: "เพิ่มขึ้น 8 รายการจากเมื่อวาน",
  },
  {
    label: "ยอดเฉลี่ยต่อบิล",
    value: "฿ 260",
    note: "เพิ่มขึ้น 5.2% จากเมื่อวาน",
  },
  { label: "โต๊ะที่มีลูกค้า", value: "12 / 16", note: "ว่าง 4 โต๊ะ" },
];

/** ความสูงแท่งกราฟรายได้ (px) ทุก 30 นาที — แท่งที่ 8 คือช่วงที่ขายดีสุด */
export const REVENUE_BARS = [40, 53, 48, 65, 78, 88, 112, 126, 111, 89];
export const REVENUE_PEAK_INDEX = 7;
export const REVENUE_TIME_LABELS = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "14:30",
];
