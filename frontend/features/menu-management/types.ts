export interface Category {
  id: string;
  name: string;
  /** false = ซ่อนทั้งหมวดจากลูกค้า */
  visible: boolean;
  sortOrder: number;
}

export interface MenuOption {
  id: string;
  name: string;
  /** ราคาที่บวกเพิ่มจากราคาเมนู 0 = ฟรี */
  price: number;
  /** false = หมดชั่วคราว ลูกค้าเลือกไม่ได้ */
  available: boolean;
}

/** กลุ่มตัวเลือกของเมนู เช่น ระดับความเผ็ด (single) หรือท็อปปิ้ง (multiple) */
export interface MenuOptionGroup {
  id: string;
  name: string;
  type: "single" | "multiple";
  /** true = ลูกค้าต้องเลือกอย่างน้อย 1 ข้อ */
  required: boolean;
  /** จำนวนที่เลือกได้สูงสุด (เฉพาะ multiple) null = ไม่จำกัด */
  max: number | null;
  options: MenuOption[];
}

/** ขนาดรูปเมนูที่แนะนำ (สัดส่วน 4:3 ตรงกับการ์ดเมนูของลูกค้า) */
export const MENU_IMAGE_SIZE = { width: 800, height: 600 } as const;

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  /** ราคา (บาท) */
  price: number;
  /** URL หรือ data URL ของรูป ว่าง = ยังไม่มีรูป */
  image: string;
  /** true = พร้อมขาย, false = หมดชั่วคราว */
  available: boolean;
  /** null = ไม่มีหมวดหมู่ */
  categoryId: string | null;
  sortOrder: number;
  optionGroups: MenuOptionGroup[];
}

/** เมนูทั้งหมดของร้าน (ตรงกับ GET /menu) */
export interface MenuData {
  categories: Category[];
  items: MenuItem[];
}

export type SaleFilter = "all" | "available" | "soldout";

/** รหัสพื้นที่ของเมนูที่ไม่มีหมวดหมู่ ใช้ในการลากจัดเรียงและตัวกรอง */
export const NO_CATEGORY = "__none";

/** ข้อมูลที่ส่งตอนสร้าง/แก้ไขเมนู */
export interface MenuItemInput {
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  categoryId: string | null;
  optionGroups: MenuOptionGroup[];
}
