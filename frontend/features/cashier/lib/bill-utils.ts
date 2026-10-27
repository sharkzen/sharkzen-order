import type {
  BillLine,
  BillRound,
  BillTotals,
  CheckoutConfig,
  TableBill,
} from "../types";

export function roundTotal(round: BillRound) {
  return round.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}

export function dishCount(rounds: BillRound[]) {
  return rounds.reduce(
    (sum, r) => sum + r.lines.reduce((n, l) => n + l.quantity, 0),
    0,
  );
}

/**
 * คำนวณยอดบิล: ยอดรวม − ส่วนลด + ค่าบริการ (คิดจากยอดหลังหักส่วนลด) ปัดเป็นบาทเต็ม
 * ส่วนลดเกินยอดรวมไม่ได้ จึงถูกจำกัดไว้ที่ยอดรวมเสมอ
 */
export function calculateTotals(
  rounds: BillRound[],
  discountInput: number,
  config: Pick<CheckoutConfig, "serviceChargePercent">,
): BillTotals {
  const subtotal = rounds.reduce((sum, r) => sum + roundTotal(r), 0);
  const discount = Math.min(
    Math.max(0, Math.round(discountInput) || 0),
    subtotal,
  );
  const serviceCharge = Math.round(
    ((subtotal - discount) * config.serviceChargePercent) / 100,
  );
  const total = subtotal - discount + serviceCharge;
  return {
    subtotal,
    discount,
    serviceCharge,
    total,
    vatIncluded: Math.round((total * 7) / 107),
    dishCount: dishCount(rounds),
  };
}

/** จำนวนรอบที่ครัวยังไม่เสิร์ฟ ใช้เตือนแคชเชียร์ก่อนรับเงิน */
export function unservedCount(bill: TableBill) {
  return bill.rounds.filter((r) => !r.served).length;
}

/** ปุ่มรับเงินสดลัด: ยอดพอดี + ธนบัตรที่มากกว่ายอด (ไม่ซ้ำ) */
export function cashShortcuts(total: number) {
  const notes = [20, 50, 100, 500, 1000];
  const over = notes.filter((note) => note >= total);
  // ธนบัตรใบเล็กไม่พอจ่ายทั้งยอด ให้เสนอทวีคูณของ 100 ที่ใกล้ที่สุดแทน
  const roundedUp = Math.ceil(total / 100) * 100;
  return [...new Set([total, roundedUp, ...over.slice(0, 3)])]
    .filter((amount) => amount >= total)
    .sort((a, b) => a - b)
    .slice(0, 4);
}

/** HH:mm จากเวลาปัจจุบันของเครื่องแคชเชียร์ (เรียกจาก event handler เท่านั้น) */
export function nowClock() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type DiscountMode = "none" | "percent" | "baht";

export interface DiscountInput {
  mode: DiscountMode;
  /** เปอร์เซ็นต์ (mode = percent) หรือจำนวนบาท (mode = baht) */
  value: number;
}

export const NO_DISCOUNT: DiscountInput = { mode: "none", value: 0 };
export const PERCENT_PRESETS = [5, 10, 20];

/** แปลงส่วนลดทุกแบบเป็นจำนวนบาท (ปัดเป็นบาทเต็ม ไม่เกินยอดรวม) */
export function discountToBaht(subtotal: number, discount: DiscountInput) {
  const raw =
    discount.mode === "percent"
      ? (subtotal * discount.value) / 100
      : discount.mode === "baht"
        ? discount.value
        : 0;
  return Math.min(Math.max(0, Math.round(raw) || 0), subtotal);
}

/** ยอดที่ต้องชำระของบิลที่ยังไม่ให้ส่วนลด ใช้แสดงบนการ์ดโต๊ะ */
export function billTotal(
  bill: TableBill,
  config: Pick<CheckoutConfig, "serviceChargePercent">,
) {
  return bill.payment
    ? bill.payment.total
    : calculateTotals(bill.rounds, 0, config).total;
}

/** รวมรายการซ้ำข้ามรอบ (ชื่อและราคาเท่ากัน) เป็นบรรทัดเดียว ใช้บนใบเสร็จ */
export function mergeLines(rounds: BillRound[]) {
  const merged = new Map<string, BillLine>();
  for (const round of rounds) {
    for (const line of round.lines) {
      const key = `${line.name}|${line.unitPrice}`;
      const found = merged.get(key);
      if (found) found.quantity += line.quantity;
      else merged.set(key, { ...line });
    }
  }
  return [...merged.values()];
}
