import type {
  FoodStatus,
  ManagedOrder,
  OrderItem,
  PaymentMethod,
  PaymentStatus,
} from "../types";

/**
 * ข้อมูลตัวอย่างสำหรับหน้าจัดการคำสั่งซื้อ (เมนูและตัวเลขเป็นข้อมูลสมมติ)
 * เมื่อมี API ให้แทนที่ด้วยข้อมูลจาก services/ โดยคง type ManagedOrder ไว้
 */
export const REPORT_DATE = "24 ตุลาคม 2569";
export const UPDATED_AT = "14:32 น.";

function item(name: string, quantity = 1): OrderItem {
  return { name, quantity };
}

function order(
  id: string,
  time: string,
  table: string,
  items: OrderItem[],
  total: number,
  status: FoodStatus,
  paymentStatus: PaymentStatus,
  paymentMethod: PaymentMethod,
): ManagedOrder {
  return {
    id,
    time,
    table,
    items,
    total,
    status,
    paymentStatus,
    paymentMethod,
  };
}

/** รายการล่าสุด 10 รายการแรก ตามที่ออกแบบไว้ */
const LATEST: ManagedOrder[] = [
  order(
    "#01258",
    "14:32",
    "05",
    [item("ข้าวกะเพราหมูสับไข่ดาว"), item("แกงเขียวหวานไก่"), item("ส้มตำไทย")],
    225,
    "new",
    "unpaid",
    "counter",
  ),
  order(
    "#01257",
    "14:30",
    "03",
    [item("ต้มยำกุ้งน้ำข้น", 2), item("ผัดไทยกุ้งสด"), item("ข้าวผัดไข่")],
    390,
    "new",
    "paid",
    "transfer",
  ),
  order(
    "#01256",
    "14:29",
    "08",
    [item("ข้าวกะเพราหมูสับไข่ดาว", 2), item("ต้มยำกุ้งน้ำข้น", 3)],
    510,
    "new",
    "paid",
    "cash",
  ),
  order(
    "#01255",
    "14:26",
    "07",
    [item("กุ้งอบวุ้นเส้น"), item("ผัดผักรวม"), item("ข้าวสวย")],
    330,
    "preparing",
    "unpaid",
    "counter",
  ),
  order(
    "#01254",
    "14:24",
    "06",
    [item("ปลาหมึกผัดไข่เค็ม"), item("ส้มตำไทย"), item("ข้าวสวย")],
    250,
    "preparing",
    "paid",
    "transfer",
  ),
  order(
    "#01253",
    "14:21",
    "10",
    [item("แกงเขียวหวานไก่"), item("ปลากะพงทอดน้ำปลา"), item("ข้าวสวย")],
    420,
    "preparing",
    "paid",
    "cash",
  ),
  order(
    "#01252",
    "14:18",
    "02",
    [item("ข้าวผัดไข่"), item("ชาไทยเย็น", 2)],
    145,
    "ready",
    "unpaid",
    "counter",
  ),
  order(
    "#01251",
    "14:14",
    "04",
    [item("ผัดไทยกุ้งสด"), item("ชาไทยเย็น")],
    130,
    "done",
    "paid",
    "transfer",
  ),
  order(
    "#01250",
    "14:10",
    "11",
    [item("ต้มยำกุ้งน้ำข้น"), item("ข้าวผัดไข่"), item("ข้าวเหนียวมะม่วง")],
    264,
    "done",
    "paid",
    "cash",
  ),
  order(
    "#01249",
    "14:02",
    "09",
    [item("แกงเขียวหวานไก่"), item("ส้มตำไทย")],
    150,
    "cancelled",
    "refunded",
    "transfer",
  ),
];

const MENU: { name: string; price: number }[] = [
  { name: "ข้าวกะเพราหมูสับไข่ดาว", price: 75 },
  { name: "ผัดไทยกุ้งสด", price: 95 },
  { name: "ต้มยำกุ้งน้ำข้น", price: 120 },
  { name: "แกงเขียวหวานไก่", price: 85 },
  { name: "ส้มตำไทย", price: 65 },
  { name: "ข้าวผัดไข่", price: 55 },
  { name: "ชาไทยเย็น", price: 35 },
  { name: "ข้าวสวย", price: 15 },
  { name: "กุ้งอบวุ้นเส้น", price: 180 },
  { name: "ผัดผักรวม", price: 60 },
];

/** สถานะของรายการเก่ากว่า 10 รายการแรก: กำลังทำ 4, เสิร์ฟแล้ว 2, ยกเลิก 1 ที่เหลือเสร็จสิ้น */
function olderStatus(index: number): FoodStatus {
  if (index < 4) return "preparing";
  if (index < 6) return "ready";
  if (index === 20) return "cancelled";
  return "done";
}

function olderOrder(index: number): ManagedOrder {
  const first = MENU[index % MENU.length];
  const second = MENU[(index * 3 + 2) % MENU.length];
  const items = [
    item(first.name, (index % 3) + 1),
    ...(second.name === first.name ? [] : [item(second.name)]),
  ];
  const total = items.reduce(
    (sum, { name, quantity }) =>
      sum + (MENU.find((m) => m.name === name)?.price ?? 0) * quantity,
    0,
  );
  const status = olderStatus(index);
  const minutes = 14 * 60 - 3 - index * 2;
  const time = `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;

  const paymentStatus: PaymentStatus =
    status === "cancelled"
      ? "refunded"
      : status === "done" || index % 2 === 0
        ? "paid"
        : "unpaid";
  const paymentMethod: PaymentMethod =
    paymentStatus === "unpaid"
      ? "counter"
      : index % 2 === 0
        ? "transfer"
        : "cash";

  return order(
    `#${String(1248 - index).padStart(5, "0")}`,
    time,
    String(((index * 7) % 16) + 1).padStart(2, "0"),
    items,
    total,
    status,
    paymentStatus,
    paymentMethod,
  );
}

const OLDER: ManagedOrder[] = Array.from({ length: 38 }, (_, i) =>
  olderOrder(i),
);

export const ORDERS: ManagedOrder[] = [...LATEST, ...OLDER];
