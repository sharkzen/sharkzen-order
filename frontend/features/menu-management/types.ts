export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  /** ราคา (บาท) */
  price: number;
  /** true = พร้อมขาย, false = หมดชั่วคราว */
  available: boolean;
  image: string;
}

export type SaleFilter = "all" | "available" | "soldout";
