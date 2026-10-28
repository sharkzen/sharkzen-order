import type { CustomerMenuItem } from "./customer-api";

/** รายการในตะกร้า: เมนูเดียวกันที่เลือกตัวเลือกต่างกันจะแยกเป็นคนละรายการ */
export interface CartLine {
  key: string;
  itemId: string;
  /** id ตัวเลือกที่เลือก (ทุกกลุ่มรวมกัน) */
  optionIds: string[];
  quantity: number;
  /** หมายเหตุของรายการนี้ */
  note?: string;
}

export interface ResolvedLine {
  key: string;
  item: CustomerMenuItem;
  optionIds: string[];
  /** ชื่อตัวเลือกที่เลือก ใช้แสดงใต้ชื่อเมนู */
  optionNames: string[];
  /** ราคาต่อหน่วย รวมราคาตัวเลือกแล้ว */
  unitPrice: number;
  quantity: number;
  note: string;
}

/** เมนูเดียวกันที่ตัวเลือกหรือหมายเหตุต่างกันแยกเป็นคนละรายการ (เช่น เย็นไม่หวาน กับ เย็นปกติ) */
export const lineKey = (itemId: string, optionIds: string[], note = "") =>
  `${itemId}|${[...optionIds].sort().join(",")}|${note.trim()}`;

/** รวมกับของเดิมในตะกร้า (ตัวเลือกเหมือนกัน = เพิ่มจำนวน) quantity <= 0 = เอาออก */
export function upsertLine(
  cart: CartLine[],
  itemId: string,
  optionIds: string[],
  delta: number,
  absolute = false,
  note = "",
) {
  const key = lineKey(itemId, optionIds, note);
  const current = cart.find((line) => line.key === key);
  const quantity = Math.min(99, (absolute ? 0 : (current?.quantity ?? 0)) + delta);
  if (quantity <= 0) return cart.filter((line) => line.key !== key);
  if (current) return cart.map((line) => (line.key === key ? { ...line, quantity } : line));
  return [...cart, { key, itemId, optionIds, quantity, note: note.trim() }];
}

/** ตั้งจำนวนของรายการตาม key (<= 0 = เอาออก) */
export function setLineQuantity(cart: CartLine[], key: string, quantity: number) {
  if (quantity <= 0) return cart.filter((line) => line.key !== key);
  return cart.map((line) => (line.key === key ? { ...line, quantity: Math.min(99, quantity) } : line));
}

/**
 * แปลงตะกร้าเป็นรายการพร้อมราคา โดยตรวจกับเมนูล่าสุด
 * เมนูหรือตัวเลือกที่หายไป/หมดชั่วคราวจะถูกตัดออก (ราคาจริงคิดที่ server อีกครั้งตอนสั่ง)
 */
export function resolveLines(items: CustomerMenuItem[], cart: CartLine[]): ResolvedLine[] {
  const resolved: ResolvedLine[] = [];
  for (const line of cart) {
    const item = items.find((candidate) => candidate.id === line.itemId);
    if (!item || !item.available) continue;
    const chosen = item.optionGroups.flatMap((group) => group.options.filter((o) => line.optionIds.includes(o.id)));
    if (chosen.length !== line.optionIds.length || chosen.some((o) => !o.available)) continue;
    resolved.push({
      key: line.key,
      item,
      optionIds: line.optionIds,
      optionNames: chosen.map((o) => o.name),
      unitPrice: item.price + chosen.reduce((sum, o) => sum + o.price, 0),
      quantity: line.quantity,
      note: line.note ?? "",
    });
  }
  return resolved;
}
