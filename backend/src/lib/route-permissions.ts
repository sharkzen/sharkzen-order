/**
 * สิทธิ์ที่พนักงานต้องมีเพื่อเรียกแต่ละ API ("METHOD /api/..." ตาม route ที่ประกาศไว้)
 * - ค่าเป็นรายการ = มีสิทธิ์ใดสิทธิ์หนึ่งในรายการก็พอ
 * - null = พนักงานที่ล็อกอินแล้วทุกคนเรียกได้
 * - ไม่อยู่ในตาราง = พนักงานเรียกไม่ได้เลย (default-deny) เช่น แพ็กเกจ/การเงินของเจ้าของ จัดการสาขา
 * เจ้าของร้านไม่ผ่านตารางนี้ (ทำได้ทุกอย่าง) เพิ่ม route ใหม่แล้วอย่าลืมเพิ่มที่นี่ ไม่งั้นพนักงานจะใช้ไม่ได้
 */
export const STAFF_ROUTE_PERMISSIONS: Record<string, string[] | null> = {
  "GET /api/auth/me": null,
  "POST /api/auth/logout": null,
  "POST /api/auth/staff-change-password": null,

  "GET /api/dashboard/overview": ["dashboard.view"],

  "GET /api/orders": ["orders.view", "kitchen.view"],
  "GET /api/orders/:id": ["orders.view", "kitchen.view"],
  "PATCH /api/orders/:id/status": ["orders.update_status", "kitchen.update_status"],
  "POST /api/orders/:id/cancel": ["orders.cancel"],
  "POST /api/orders/:id/ack-cancel": ["orders.update_status", "kitchen.update_status"],
  "PATCH /api/orders/:id/items/:itemId": ["orders.cancel"],
  "POST /api/orders/:id/items/:itemId/cancel": ["orders.cancel"],

  "GET /api/cashier/bills": ["cashier.view"],
  "GET /api/cashier/orders/:id/receipt": ["cashier.view"],
  "POST /api/cashier/tables/:tableId/items": ["orders.payment", "cashier.view"],
  "POST /api/cashier/tables/:tableId/pay": ["orders.payment"],

  "GET /api/menu": ["menu.view"],
  "POST /api/menu/categories": ["menu.edit"],
  "PUT /api/menu/categories/order": ["menu.edit"],
  "PATCH /api/menu/categories/:id": ["menu.edit"],
  "DELETE /api/menu/categories/:id": ["menu.delete"],
  "POST /api/menu/items": ["menu.edit"],
  "POST /api/menu/items/bulk": ["menu.edit"],
  "PUT /api/menu/items/order": ["menu.edit"],
  "PATCH /api/menu/items/:id": ["menu.edit", "menu.availability"],
  "DELETE /api/menu/items/:id": ["menu.delete"],

  "GET /api/tables": ["tables.view"],
  "POST /api/tables": ["tables.manage"],
  "POST /api/tables/delete": ["tables.manage"],
  "PUT /api/tables/order": ["tables.manage"],
  "PATCH /api/tables/:id": ["tables.manage"],
  "POST /api/tables/:id/open": ["tables.manage"],
  "POST /api/tables/:id/close": ["tables.manage"],

  "GET /api/reports/sales": ["reports.view"],

  "GET /api/notifications": null,
  "POST /api/notifications/read-all": null,
  "POST /api/notifications/:id/read": null,

  "GET /api/shop": null,
  "PUT /api/shop": ["settings.edit"],
  "PATCH /api/shop/open": ["settings.edit"],
  "POST /api/uploads/image": ["menu.edit", "settings.edit"],

  "GET /api/staff": ["staff.view"],
  "GET /api/staff/username-available": ["staff.create", "staff.manage"],
  "POST /api/staff/roles": ["staff.roles"],
  "PUT /api/staff/roles/:id": ["staff.roles"],
  "DELETE /api/staff/roles/:id": ["staff.roles"],
  "POST /api/staff/members": ["staff.create"],
  "PATCH /api/staff/members/:id": ["staff.manage"],
  "POST /api/staff/members/:id/reset-password": ["staff.reset_password"],
  "DELETE /api/staff/members/:id": ["staff.manage"],
};

/** พนักงานคนนี้เรียก route นี้ได้หรือไม่ (ไม่รู้จัก route = ไม่ได้) */
export function staffMayCall(method: string, url: string, permissions: readonly string[]) {
  const rule = STAFF_ROUTE_PERMISSIONS[`${method} ${url}`];
  if (rule === undefined) return false;
  return rule === null || rule.some((permission) => permissions.includes(permission));
}
