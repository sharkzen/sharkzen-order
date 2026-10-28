import {
  NO_CATEGORY,
  type Category,
  type MenuData,
  type MenuItem,
  type SaleFilter,
} from "@/features/menu-management/types";

export const SALE_OPTIONS: { value: SaleFilter; label: string }[] = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "available", label: "พร้อมขาย" },
  { value: "soldout", label: "หมดชั่วคราว" },
];

/** พื้นที่ลากจัดเรียง: รหัสหมวด (หรือ NO_CATEGORY) → รหัสเมนูตามลำดับ */
export type Board = Record<string, string[]>;

const bySort = <T extends { sortOrder: number }>(a: T, b: T) => a.sortOrder - b.sortOrder;

export const containerOf = (item: MenuItem) => item.categoryId ?? NO_CATEGORY;

/** จัดเมนูทุกชิ้นลงหมวดตามลำดับที่เจ้าของจัดไว้ (มีครบทุกหมวด แม้หมวดว่าง) */
export function toBoard({ categories, items }: MenuData): Board {
  const board: Board = { [NO_CATEGORY]: [] };
  for (const category of categories) board[category.id] = [];
  for (const item of [...items].sort(bySort)) {
    (board[containerOf(item)] ??= []).push(item.id);
  }
  return board;
}

/** ใช้ลำดับจาก board เขียนทับ categoryId/sortOrder ของเมนู (ใช้ตอนอัปเดตหน้าจอทันทีหลังลาก) */
export function applyBoard(data: MenuData, board: Board): MenuData {
  const place = new Map<string, { categoryId: string | null; sortOrder: number }>();
  for (const [container, ids] of Object.entries(board)) {
    ids.forEach((id, sortOrder) =>
      place.set(id, { categoryId: container === NO_CATEGORY ? null : container, sortOrder }),
    );
  }
  return {
    ...data,
    items: data.items.map((item) => ({ ...item, ...place.get(item.id) })),
  };
}

export function reorderCategories(data: MenuData, ids: string[]): MenuData {
  const byId = new Map(data.categories.map((category) => [category.id, category]));
  const categories = ids
    .map((id, sortOrder) => {
      const category = byId.get(id);
      return category && { ...category, sortOrder };
    })
    .filter((category): category is Category => Boolean(category));
  return { ...data, categories };
}

interface Filters {
  query: string;
  sale: SaleFilter;
}

/** เมนูที่ตรงกับคำค้นและสถานะการขาย (หมวดหมู่ใช้การเลือกในแผงหมวดหมู่) */
export function matchesFilters(menu: MenuItem, { query, sale }: Filters) {
  if (sale === "available" && !menu.available) return false;
  if (sale === "soldout" && menu.available) return false;
  const q = query.trim().toLowerCase();
  return !q || menu.name.toLowerCase().includes(q) || menu.description.toLowerCase().includes(q);
}

export function summarize(menus: MenuItem[]) {
  const available = menus.filter((menu) => menu.available).length;
  return { total: menus.length, available, soldout: menus.length - available };
}

export function sortedCategories(categories: Category[]) {
  return [...categories].sort(bySort);
}

export function countByCategory(items: MenuItem[]) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = containerOf(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}
