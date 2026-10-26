import type {
  KitchenItem,
  KitchenOrder,
  KitchenStatus,
  PaymentState,
} from "../types";

/**
 * ข้อมูลตัวอย่างสำหรับหน้าจอครัว (ร้านและเมนูเป็นข้อมูลสมมติ)
 * waitMinutes = เวลาที่งานอยู่ในสถานะปัจจุบันมาแล้ว ณ ตอนเปิดหน้า
 * เมื่อมี API ให้ส่ง KitchenOrder[] เข้ามาแทน และอัปเดตสถานะผ่านการเรียก API
 */
export const KITCHEN = {
  shop: "ครัวริมทะเล",
  branch: "สาขาหาดเจ้าสำราญ • ครัวหลัก",
  /** งานที่รอเกินกี่นาทีถือว่าเร่งด่วน */
  urgentAfterMinutes: 10,
  /** เล่นเสียงซ้ำทุกกี่วินาที ขณะที่ยังมีออเดอร์ใหม่ที่ยังไม่รับ (เมื่อเปิดตัวเลือกเล่นซ้ำ) */
  repeatAlertSeconds: 12,
} as const;

const item = (name: string, quantity = 1): KitchenItem => ({ name, quantity });

function order(
  id: string,
  table: string,
  orderedAt: string,
  status: KitchenStatus,
  waitMinutes: number,
  items: KitchenItem[],
  total: number,
  payment: { state: PaymentState; method: string },
  notes: string[] = [],
  pickupSlot?: number,
): KitchenOrder {
  return {
    id,
    table,
    orderedAt,
    items,
    notes,
    total,
    payment,
    status,
    since: -waitMinutes * 60,
    pickupSlot,
  };
}

const COUNTER = { state: "unpaid", method: "ชำระที่เคาน์เตอร์" } as const;
const TRANSFER = { state: "paid", method: "โอนเงิน" } as const;
const CASH = { state: "paid", method: "เงินสด" } as const;

export const KITCHEN_ORDERS: KitchenOrder[] = [
  // ใหม่
  order(
    "#01258",
    "05",
    "14:32",
    "new",
    0,
    [item("ข้าวกะเพราหมูสับไข่ดาว"), item("แกงเขียวหวานไก่"), item("ส้มตำไทย")],
    225,
    COUNTER,
    ["ส้มตำไม่ใส่ถั่วลิสง"],
  ),
  order(
    "#01257",
    "03",
    "14:30",
    "new",
    2,
    [item("ต้มยำกุ้งน้ำข้น", 2), item("ผัดไทยกุ้งสด"), item("ข้าวผัดไข่")],
    390,
    TRANSFER,
    ["ต้มยำเผ็ดน้อย"],
  ),
  order(
    "#01256",
    "08",
    "14:29",
    "new",
    3,
    [item("ข้าวกะเพราหมูสับไข่ดาว", 2), item("ต้มยำกุ้งน้ำข้น", 3)],
    510,
    CASH,
    ["แยกพริกน้ำปลา"],
  ),

  order(
    "#01245",
    "15",
    "14:31",
    "new",
    1,
    [
      item("ข้าวกะเพราหมูสับไข่ดาว", 3),
      item("ผัดไทยกุ้งสด", 2),
      item("ต้มยำกุ้งน้ำข้น", 2),
      item("แกงเขียวหวานไก่"),
      item("ส้มตำไทย", 2),
      item("ปลากะพงทอดน้ำปลา"),
      item("กุ้งอบวุ้นเส้น"),
      item("ข้าวผัดไข่", 2),
      item("ผัดผักรวม"),
      item("ข้าวสวย", 6),
      item("ชาไทยเย็น", 5),
      item("ข้าวเหนียวมะม่วง", 3),
    ],
    1840,
    TRANSFER,
    ["โต๊ะเลี้ยงวันเกิด ขอเสิร์ฟพร้อมกัน", "ส้มตำ 1 จานไม่ใส่ปู"],
  ),

  // กำลังทำ
  order(
    "#01255",
    "07",
    "14:26",
    "preparing",
    6,
    [item("กุ้งอบวุ้นเส้น"), item("ผัดผักรวม"), item("ข้าวสวย", 2)],
    330,
    COUNTER,
    ["กุ้งอบวุ้นเส้นไม่ใส่ขึ้นฉ่าย"],
  ),
  order(
    "#01254",
    "06",
    "14:24",
    "preparing",
    8,
    [item("ปลาหมึกผัดไข่เค็ม"), item("ส้มตำไทย"), item("ข้าวสวย")],
    250,
    TRANSFER,
    ["ส้มตำไม่เผ็ด"],
  ),
  order(
    "#01253",
    "10",
    "14:21",
    "preparing",
    11,
    [item("แกงเขียวหวานไก่"), item("ปลากะพงทอดน้ำปลา"), item("ข้าวสวย", 2)],
    420,
    CASH,
  ),
  order(
    "#01251",
    "01",
    "14:27",
    "preparing",
    5,
    [item("ผัดไทยกุ้งสด"), item("ชาไทยเย็น", 2)],
    165,
    TRANSFER,
    ["ชาไทยหวานน้อย"],
  ),
  order(
    "#01250",
    "09",
    "14:28",
    "preparing",
    4,
    [item("ข้าวผัดไข่", 2), item("ส้มตำไทย")],
    175,
    COUNTER,
  ),
  order(
    "#01249",
    "12",
    "14:29",
    "preparing",
    3,
    [item("ต้มยำกุ้งน้ำข้น"), item("ข้าวสวย")],
    135,
    TRANSFER,
  ),
  order(
    "#01246",
    "14",
    "14:30",
    "preparing",
    2,
    [item("ข้าวเหนียวมะม่วง", 2)],
    178,
    CASH,
    ["ขอมะม่วงสุก"],
  ),

  // พร้อมเสิร์ฟ
  order(
    "#01252",
    "02",
    "14:18",
    "ready",
    4,
    [item("ข้าวผัดไข่", 2), item("ชาไทยเย็น")],
    145,
    COUNTER,
    [],
    1,
  ),
  order(
    "#01248",
    "04",
    "14:10",
    "ready",
    7,
    [item("ปลาหมึกผัดไข่เค็ม"), item("ไก่ผัดเม็ดมะม่วง")],
    280,
    TRANSFER,
    [],
    2,
  ),
  order(
    "#01247",
    "11",
    "14:08",
    "ready",
    6,
    [item("กุ้งอบวุ้นเส้น"), item("ข้าวผัดไข่")],
    185,
    CASH,
    [],
    1,
  ),
];

/** ออเดอร์ตัวอย่างสำหรับปุ่ม "จำลองออเดอร์ใหม่" (ใช้ทดสอบเสียงและการแจ้งเตือนก่อนต่อ API จริง) */
export const SIMULATED_ORDERS: Pick<
  KitchenOrder,
  "table" | "items" | "notes" | "total" | "payment"
>[] = [
  {
    table: "13",
    items: [item("ข้าวผัดไข่", 2), item("ส้มตำไทย"), item("ชาไทยเย็น", 2)],
    notes: ["ส้มตำไม่เผ็ด"],
    total: 245,
    payment: TRANSFER,
  },
  {
    table: "16",
    items: [item("ต้มยำกุ้งน้ำข้น"), item("ข้าวสวย", 2)],
    notes: [],
    total: 150,
    payment: COUNTER,
  },
  {
    table: "01",
    items: [item("ผัดไทยกุ้งสด", 2), item("กุ้งอบวุ้นเส้น")],
    notes: ["ผัดไทยไม่ใส่ถั่วงอก"],
    total: 320,
    payment: CASH,
  },
];
