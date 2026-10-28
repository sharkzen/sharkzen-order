import { clientHttp } from "@/lib/http/client";

export type BlockReason = "SHOP_CLOSED" | "TABLE_CLOSED";

export interface CustomerOption {
  id: string;
  name: string;
  /** ราคาที่บวกเพิ่มจากราคาเมนู 0 = ฟรี */
  price: number;
  available: boolean;
}

export interface CustomerOptionGroup {
  id: string;
  name: string;
  type: "single" | "multiple";
  required: boolean;
  max: number | null;
  options: CustomerOption[];
}

export interface CustomerMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  /** เมนูแนะนำของร้าน (ไม่เกิน 4 เมนู) */
  featured: boolean;
  categoryId: string | null;
  optionGroups: CustomerOptionGroup[];
}

/** ข้อมูลที่ลูกค้าเห็นหลังสแกน QR (ตรงกับ GET /public/t/:token) */
export interface CustomerMenu {
  shop: { name: string; branch: string; hours: string | null; coverImage: string };
  table: { name: string; zone: string };
  canOrder: boolean;
  blocked: BlockReason | null;
  categories: { id: string; name: string }[];
  items: CustomerMenuItem[];
}

export type CustomerOrderStatus = "NEW" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";

export interface CustomerOrder {
  id: string;
  number: number;
  status: CustomerOrderStatus;
  createdAt: string;
  total: number;
  cancelReason: string | null;
  items: { id: string; name: string; options: string[]; note: string; quantity: number }[];
}

export interface PlaceOrderBody {
  items: { menuItemId: string; quantity: number; options: string[]; note: string }[];
  notes: string[];
}

export const customerApi = {
  menu: (token: string, signal?: AbortSignal) =>
    clientHttp.get<CustomerMenu>(`/public/t/${token}`, { signal }).then((res) => res.data),
  orders: (token: string, signal?: AbortSignal) =>
    clientHttp.get<CustomerOrder[]>(`/public/t/${token}/orders`, { signal }).then((res) => res.data),
  callStaff: (token: string) => clientHttp.post(`/public/t/${token}/call-staff`),
  placeOrder: (token: string, body: PlaceOrderBody) =>
    clientHttp.post<{ number: number }>(`/public/t/${token}/orders`, body).then((res) => res.data),
};
