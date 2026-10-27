import type { ShopSettings } from "../types";

/**
 * ค่าตั้งต้นของหน้าตั้งค่าร้าน (ชื่อร้านและเลขต่างๆ เป็นข้อมูลสมมติ)
 * เมื่อมี API ให้โหลดค่าจริงจาก services/ แล้วส่งเข้า SettingsWorkspace โดยคง type ShopSettings ไว้
 */
export const UPDATED_AT = "14:32 น.";

export const WEEKDAY_NAMES = [
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
  "อาทิตย์",
];

export const SHOP_SETTINGS: ShopSettings = {
  name: "ครัวริมทะเล",
  branch: "สาขาหาดเจ้าสำราญ",
  phone: "032-123-456",
  address: "99/9 ถนนตัวอย่าง ตำบลสมมติ อำเภอเมือง จังหวัดเพชรบุรี 76000",
  hours: [
    { open: true, from: "10:00", to: "22:00" },
    { open: true, from: "10:00", to: "22:00" },
    { open: true, from: "10:00", to: "22:00" },
    { open: true, from: "10:00", to: "22:00" },
    { open: true, from: "10:00", to: "22:00" },
    { open: true, from: "10:00", to: "23:00" },
    { open: true, from: "10:00", to: "23:00" },
  ],
  acceptOrders: true,
  payBeforeKitchen: false,
  acceptTransfer: true,
  acceptCash: true,
  acceptCounter: true,
  promptPayId: "0812345678",
  serviceChargePercent: 0,
  vatIncluded: true,
  newOrderSound: true,
  newOrderPopup: true,
  dailySummary: false,
};
