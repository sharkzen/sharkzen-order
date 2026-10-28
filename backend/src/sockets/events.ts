/** ห้อง socket ของร้าน ส่ง event เฉพาะเจ้าของ/พนักงานร้านนั้น */
export const shopRoom = (shopId: string) => `shop:${shopId}`;

/** ชื่อ event ที่ server ส่งให้ client (frontend ใช้ชื่อเดียวกันใน lib/socket) */
export const SocketEvent = {
  OrderCreated: "order:created",
  OrderUpdated: "order:updated",
  /** ตั้งค่าร้านหรือสถานะเปิด-ปิดร้านเปลี่ยน */
  ShopUpdated: "shop:updated",
  /** เมนู/หมวดหมู่เปลี่ยน (ให้ client โหลดใหม่) */
  MenuChanged: "menu:changed",
  /** โต๊ะ/การเปิด-ปิดโต๊ะ/บิลเปลี่ยน */
  TablesChanged: "tables:changed",
  StaffChanged: "staff:changed",
  NotificationCreated: "notification:new",
} as const;
