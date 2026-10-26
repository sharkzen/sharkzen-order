import type { KitchenItem, KitchenOrder, KitchenStatus } from "../types";

/** เวลาที่งานอยู่ในสถานะปัจจุบันมาแล้ว (นาที) */
export function waitMinutes(order: KitchenOrder, ticks: number) {
  return Math.max(0, Math.floor((ticks - order.since) / 60));
}

/** งานที่ถูกยกเลิกแล้วไม่นับว่าเร่งด่วน (ไม่ต้องทำต่อ) */
export function isUrgent(
  order: KitchenOrder,
  ticks: number,
  urgentAfter: number,
) {
  return (
    !order.cancellation &&
    order.status === "preparing" &&
    waitMinutes(order, ticks) >= urgentAfter
  );
}

/** จำนวนของรายการที่ยังต้องทำ (หักส่วนที่ยกเลิกแล้ว) */
export function activeQuantity(item: KitchenItem) {
  return item.quantity - (item.cancelledQty ?? 0);
}

export function countItems(order: KitchenOrder) {
  return order.items.reduce((sum, item) => sum + activeQuantity(item), 0);
}

/** งานที่หน้าร้านยกเลิกขึ้นก่อนเพื่อให้เห็นทันที ที่เหลือรอนานสุดขึ้นก่อน */
export function sortByWait(orders: KitchenOrder[], ticks: number) {
  return [...orders].sort((a, b) => {
    const cancelled = Number(!!b.cancellation) - Number(!!a.cancellation);
    return cancelled || waitMinutes(b, ticks) - waitMinutes(a, ticks);
  });
}

/** สถานะถัดไปเมื่อกดปุ่มหลักของการ์ด (ready -> null = เสิร์ฟแล้ว หายจากกระดาน) */
export const NEXT_STATUS: Record<KitchenStatus, KitchenStatus | null> = {
  new: "preparing",
  preparing: "ready",
  ready: null,
};

/** ขั้นตอนของงานหนึ่งรายการ ใช้แสดงความคืบหน้าในหน้ารายละเอียด */
export const STEPS: { status: KitchenStatus | "served"; label: string }[] = [
  { status: "new", label: "รับออร์เดอร์" },
  { status: "preparing", label: "กำลังทำ" },
  { status: "ready", label: "พร้อมเสิร์ฟ" },
  { status: "served", label: "เสิร์ฟแล้ว" },
];

/** ค้นหางานจากเลขโต๊ะ เลขคำสั่งซื้อ หรือชื่ออาหาร (ว่าง = ตรงทั้งหมด) */
export function matchesQuery(order: KitchenOrder, query: string) {
  const text = query.trim().toLowerCase().replace(/^#/, "");
  if (!text) return true;
  return (
    order.table.includes(text) ||
    order.id.toLowerCase().replace("#", "").includes(text) ||
    order.items.some(({ name }) => name.toLowerCase().includes(text))
  );
}

/**
 * เหตุผลที่ครัวยกเลิกเองได้ (ทั้งออเดอร์และรายจาน)
 * กรณีลูกค้าขอยกเลิกให้หน้าร้านทำที่ /orders เพราะเกี่ยวกับการคืนเงิน
 */
export const KITCHEN_CANCEL_REASONS = [
  "วัตถุดิบหมด",
  "ทำไม่ได้ เกิดปัญหาในครัว",
  "ออเดอร์ซ้ำหรือผิดปกติ",
] as const;
