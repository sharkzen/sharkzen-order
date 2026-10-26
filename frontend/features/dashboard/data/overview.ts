import { Armchair, ReceiptText, ShoppingBasket, Wallet } from "lucide-react";
import type {
  Account,
  Metric,
  OrderStatusCount,
  PopularMenu,
  RecentOrder,
  RevenueSummary,
  ShopInfo,
} from "../types";

/**
 * ข้อมูลตัวอย่างสำหรับหน้าภาพรวมร้านอาหาร (ชื่อร้านและตัวเลขเป็นข้อมูลสมมติ)
 * เมื่อมี API แล้วให้แทนที่ด้วยข้อมูลจาก services/ โดยคง type เดิมไว้
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

export const REPORT_DATE = "24 ตุลาคม 2569";
export const UPDATED_AT = "14:32 น.";

export const METRICS: Metric[] = [
  {
    id: "revenue",
    label: "รายได้วันนี้",
    value: "฿ 12,480",
    note: "เพิ่มขึ้น 12.8% จากเมื่อวาน",
    icon: Wallet,
    tone: "primary",
  },
  {
    id: "orders",
    label: "คำสั่งซื้อทั้งหมด",
    value: "48",
    note: "เพิ่มขึ้น 8 คำสั่งซื้อจากเมื่อวาน",
    icon: ReceiptText,
    tone: "success",
  },
  {
    id: "average",
    label: "ยอดเฉลี่ยต่อคำสั่งซื้อ",
    value: "฿ 260",
    note: "เพิ่มขึ้น 5.2% จากเมื่อวาน",
    icon: ShoppingBasket,
    tone: "warning",
  },
  {
    id: "tables",
    label: "โต๊ะที่มีลูกค้า",
    value: "12 / 16",
    note: "ว่าง 4 โต๊ะ • ใช้งานอยู่ 75%",
    icon: Armchair,
    tone: "primary",
  },
];

export const REVENUE: RevenueSummary = {
  total: 12480,
  changePercent: 12.8,
  axisMax: 2000,
  bars: [
    { time: "10:00", amount: 610 },
    { time: "10:30", amount: 820 },
    { time: "11:00", amount: 740 },
    { time: "11:30", amount: 1000 },
    { time: "12:00", amount: 1200 },
    { time: "12:30", amount: 1360 },
    { time: "13:00", amount: 1730 },
    { time: "13:30", amount: 1940 },
    { time: "14:00", amount: 1700 },
    { time: "14:30", amount: 1380 },
  ],
  timeLabels: ["10:00", "11:00", "12:00", "13:00", "14:00", "14:30"],
  updatedAt: UPDATED_AT,
};

export const ORDER_STATUSES: OrderStatusCount[] = [
  { status: "new", label: "ใหม่", count: 3 },
  { status: "preparing", label: "กำลังทำ", count: 7 },
  { status: "ready", label: "เสิร์ฟแล้ว", count: 3 },
  { status: "done", label: "เสร็จสิ้น", count: 33 },
  { status: "cancelled", label: "ยกเลิก", count: 2 },
];

export const POPULAR_MENUS: PopularMenu[] = [
  {
    name: "ข้าวกะเพราหมูสับไข่ดาว",
    quantity: 18,
    revenue: 1350,
    image: "/images/dashboard/menu-1.jpg",
  },
  {
    name: "ผัดไทยกุ้งสด",
    quantity: 14,
    revenue: 1330,
    image: "/images/dashboard/menu-2.jpg",
  },
  {
    name: "ต้มยำกุ้งน้ำข้น",
    quantity: 12,
    revenue: 1440,
    image: "/images/dashboard/menu-3.jpg",
  },
  {
    name: "แกงเขียวหวานไก่",
    quantity: 9,
    revenue: 765,
    image: "/images/dashboard/menu-4.jpg",
  },
  {
    name: "ส้มตำไทย",
    quantity: 8,
    revenue: 520,
    image: "/images/dashboard/menu-5.jpg",
  },
];

export const RECENT_ORDERS: RecentOrder[] = [
  { id: "#01258", time: "14:32 น.", table: "05", total: 225, status: "new" },
  { id: "#01257", time: "14:30 น.", table: "03", total: 390, status: "new" },
  { id: "#01256", time: "14:29 น.", table: "08", total: 510, status: "new" },
  {
    id: "#01255",
    time: "14:26 น.",
    table: "07",
    total: 330,
    status: "preparing",
  },
  {
    id: "#01254",
    time: "14:24 น.",
    table: "06",
    total: 250,
    status: "preparing",
  },
  {
    id: "#01253",
    time: "14:21 น.",
    table: "10",
    total: 420,
    status: "preparing",
  },
];
