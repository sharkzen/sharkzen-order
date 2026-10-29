/** ห้อง socket ของร้าน ส่ง event เฉพาะเจ้าของ/พนักงานร้านนั้น */
export const shopRoom = (shopId: string) => `shop:${shopId}`;

/** ห้อง socket ของโต๊ะ: หน้าลูกค้าที่สแกน QR โต๊ะนั้นเข้าห้องนี้ เพื่อรู้ทันทีว่ามีอะไรเปลี่ยน */
export const tableRoom = (tableId: string) => `table:${tableId}`;

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
  /** ส่งให้ลูกค้าของโต๊ะ: ออเดอร์/รอบโต๊ะเปลี่ยน (ไม่มีข้อมูลแนบ ให้โหลดใหม่ผ่าน REST ที่ตรวจตั๋วรอบ) */
  TableChanged: "table:changed",
  /** ผู้ดูแลระบบแบน/ระงับ/ปลดบัญชีหรือร้านนี้ client ต้องตรวจสิทธิ์ใหม่ทันที */
  AccessChanged: "access:changed",
} as const;

/** แจ้งลูกค้าที่เปิดหน้าโต๊ะนี้อยู่ให้โหลดข้อมูลใหม่ (ไม่ส่งข้อมูลจริงไปทาง socket) */
export const emitToTable = (io: { to: (room: string) => { emit: (event: string) => unknown } }, tableId: string) =>
  io.to(tableRoom(tableId)).emit(SocketEvent.TableChanged);
