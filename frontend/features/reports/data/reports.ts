import type { DailySales, MenuItemInfo } from "../types";

/**
 * ข้อมูลตัวอย่างสำหรับหน้ารายงานยอดขาย (ตัวเลขเป็นข้อมูลสมมติ สร้างแบบคงที่ทุกครั้งที่โหลด)
 * เมื่อมี API ให้แทนที่ DAILY_SALES ด้วยข้อมูลจาก services/ โดยคง type DailySales ไว้
 */
export const REPORT_END_DATE = "2026-10-24";
export const UPDATED_AT = "14:32 น.";

/** ชั่วโมงเปิดร้าน 10:00–21:59 น. */
export const FIRST_HOUR = 10;
export const HOURS = Array.from({ length: 12 }, (_, i) => FIRST_HOUR + i);

/** ข้อมูลย้อนหลังที่เตรียมไว้ (ช่วงที่ยาวที่สุด 30 วัน + 30 วันก่อนหน้าไว้เทียบ) */
export const HISTORY_DAYS = 60;

/** ชื่อและราคาตรงกับหน้าจัดการเมนู */
export const MENU_ITEMS: MenuItemInfo[] = [
  { name: "ข้าวกะเพราหมูสับไข่ดาว", price: 75 },
  { name: "แกงเขียวหวานไก่", price: 85 },
  { name: "ส้มตำไทย", price: 65 },
  { name: "ต้มยำกุ้งน้ำข้น", price: 120 },
  { name: "ผัดไทยกุ้งสด", price: 95 },
  { name: "ข้าวผัดไข่", price: 55 },
  { name: "ชาไทยเย็น", price: 35 },
  { name: "ข้าวเหนียวมะม่วง", price: 89 },
  { name: "กุ้งอบวุ้นเส้น", price: 130 },
];

/** ความนิยมสัมพัทธ์ของแต่ละเมนู (ลำดับเดียวกับ MENU_ITEMS) */
const MENU_WEIGHT = [1.6, 0.9, 1.0, 0.8, 1.1, 1.3, 1.5, 0.7, 0.5];
/** น้ำหนักยอดขายรายชั่วโมง: พีคมื้อเที่ยง (12–13) และมื้อเย็น (18–19) */
const HOUR_WEIGHT = [
  0.5, 0.8, 1.7, 1.9, 1.1, 0.7, 0.6, 1.0, 1.6, 1.8, 1.0, 0.5,
];
/** น้ำหนักตามวัน เริ่มจันทร์: เสาร์-อาทิตย์ขายดีกว่า */
const WEEKDAY_WEIGHT = [0.85, 0.8, 0.9, 0.95, 1.15, 1.4, 1.3];

/** สุ่มแบบกำหนด seed เพื่อให้ผลเหมือนเดิมทุกครั้ง (server กับ client ตรงกัน) */
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isoDaysBefore(endIso: string, offset: number) {
  const [year, month, day] = endIso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day - offset));
  return date.toISOString().slice(0, 10);
}

function weekdayOf(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  // getUTCDay: 0 = อาทิตย์ → แปลงให้ 0 = จันทร์
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

function buildDay(date: string, random: () => number): DailySales {
  const dayFactor = WEEKDAY_WEIGHT[weekdayOf(date)] * (0.88 + random() * 0.26);

  const hours = HOUR_WEIGHT.map((weight) => {
    const orders = Math.max(
      0,
      Math.round(weight * dayFactor * 3.2 * (0.7 + random() * 0.6)),
    );
    const average = 230 + random() * 70;
    return { orders, revenue: Math.round((orders * average) / 5) * 5 };
  });

  const revenue = hours.reduce((sum, hour) => sum + hour.revenue, 0);
  const dishes = hours.reduce((sum, hour) => sum + hour.orders, 0) * 2.6;
  const weightTotal = MENU_WEIGHT.reduce((sum, weight) => sum + weight, 0);
  const menu = MENU_WEIGHT.map((weight) =>
    Math.round((weight / weightTotal) * dishes * (0.8 + random() * 0.4)),
  );

  const transfer = Math.round((revenue * (0.52 + random() * 0.12)) / 5) * 5;
  const counter = Math.round((revenue * (0.12 + random() * 0.06)) / 5) * 5;
  const methods = {
    transfer,
    counter,
    cash: revenue - transfer - counter,
  };

  return { date, hours, menu, methods };
}

const random = createRandom(2569);

/** เรียงจากเก่าไปใหม่ วันสุดท้ายคือ REPORT_END_DATE */
export const DAILY_SALES: DailySales[] = Array.from(
  { length: HISTORY_DAYS },
  (_, index) =>
    buildDay(isoDaysBefore(REPORT_END_DATE, HISTORY_DAYS - 1 - index), random),
);
