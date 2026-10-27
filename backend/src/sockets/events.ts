/** ชื่อ event ที่ server ส่งให้ client (frontend ควรใช้ชื่อเดียวกัน) */
export const SocketEvent = {
  OrderCreated: "order:created",
  OrderUpdated: "order:updated",
} as const;
