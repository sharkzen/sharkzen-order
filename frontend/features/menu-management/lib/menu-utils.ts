import type { MenuItem, SaleFilter } from "../types";

export const PAGE_SIZE = 10;

export const SALE_OPTIONS: { value: SaleFilter; label: string }[] = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "available", label: "พร้อมขาย" },
  { value: "soldout", label: "หมดชั่วคราว" },
];

interface Filters {
  query: string;
  category: string;
  sale: SaleFilter;
}

/** category ว่าง = ทุกหมวดหมู่ */
export function filterMenus(menus: MenuItem[], filters: Filters) {
  const query = filters.query.trim().toLowerCase();

  return menus.filter((menu) => {
    if (filters.category && menu.category !== filters.category) return false;
    if (filters.sale === "available" && !menu.available) return false;
    if (filters.sale === "soldout" && menu.available) return false;
    if (!query) return true;
    return (
      menu.name.toLowerCase().includes(query) ||
      menu.description.toLowerCase().includes(query)
    );
  });
}

export function listCategories(menus: MenuItem[]) {
  return [...new Set(menus.map((menu) => menu.category))];
}

export function summarize(menus: MenuItem[]) {
  const available = menus.filter((menu) => menu.available).length;
  return {
    total: menus.length,
    available,
    soldout: menus.length - available,
  };
}
