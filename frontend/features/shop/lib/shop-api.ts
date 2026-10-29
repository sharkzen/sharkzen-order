import { clientHttp } from "@/lib/http/client";
import type { DayHours } from "@/features/shop-settings/types";

/** ร้านของผู้ใช้ที่ล็อกอิน (ตรงกับ GET /shop) */
export interface Shop {
  id: string;
  name: string;
  isOpen: boolean;
  branch: string;
  phone: string;
  address: string;
  /** URL รูปปกร้าน "" = ยังไม่ตั้ง (หน้าลูกค้าใช้รูปตั้งต้น) */
  coverImage: string;
  hours: DayHours[];
  payBeforeKitchen: boolean;
  acceptTransfer: boolean;
  acceptCash: boolean;
  acceptCounter: boolean;
  promptPayId: string;
  promptPayTitle: string;
  promptPayFirstName: string;
  promptPayLastName: string;
  serviceChargePercent: number;
  vatIncluded: boolean;
  newOrderSound: boolean;
  newOrderPopup: boolean;
  dailySummary: boolean;
  updatedAt: string;
}

export type ShopSettingsBody = Omit<Shop, "id" | "isOpen" | "updatedAt">;

export type NotificationType =
  | "ORDER_NEW"
  | "ORDER_PAID"
  | "ORDER_CANCELLED"
  | "SHOP_STATUS"
  | "SYSTEM"
  | "STAFF_CALL";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
}

/** อัปโหลดรูปปกร้าน (ตัดตามสัดส่วนแล้ว) server แปลงเป็น WebP เก็บบน R2 แล้วคืน URL */
export const uploadCoverImage = (image: Blob) => {
  const form = new FormData();
  form.append("file", image, "cover.jpg");
  return clientHttp
    .post<{ url: string }>("/uploads/image", form, { params: { folder: "cover" }, timeout: 60_000, headers: { "Content-Type": "multipart/form-data" } })
    .then((res) => res.data.url);
};

/** สาขาของบัญชี (ตรงกับ GET /shop/branches) */
export interface Branch {
  id: string;
  name: string;
  /** ชื่อสาขา ว่าง = ยังไม่ได้ตั้งชื่อ */
  branch: string;
  isOpen: boolean;
  /** สาขาที่กำลังจัดการอยู่ */
  active: boolean;
}

/** สาขาทั้งหมดพร้อมเพดานตามแพ็กเกจที่ใช้อยู่ */
export interface BranchList {
  items: Branch[];
  /** จำนวนสาขาสูงสุดของแพ็กเกจ */
  limit: number;
  planName: string;
}

export const shopApi = {
  branches: () => clientHttp.get<BranchList>("/shop/branches"),
  createBranch: (branch: string) => clientHttp.post<BranchList>("/shop/branches", { branch }),
  switchBranch: (shopId: string) => clientHttp.put<BranchList>("/shop/branches/active", { shopId }),
  get: () => clientHttp.get<Shop>("/shop"),
  update: (body: ShopSettingsBody) => clientHttp.put<Shop>("/shop", body),
  setOpen: (isOpen: boolean) => clientHttp.patch<Shop>("/shop/open", { isOpen }),
  /** หน้าละ 15 รายการ ส่ง after = id รายการสุดท้ายเพื่อโหลดหน้าถัดไป */
  notifications: (after?: string) =>
    clientHttp.get<{ items: AppNotification[]; unread: number; hasMore: boolean }>("/notifications", {
      params: { limit: 15, after },
    }),
  readNotification: (id: string) => clientHttp.post(`/notifications/${id}/read`),
  readAllNotifications: () => clientHttp.post("/notifications/read-all"),
};
