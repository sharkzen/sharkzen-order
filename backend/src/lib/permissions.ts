/** แคตตาล็อกสิทธิ์ ต้องตรงกับ RESOURCES ฝั่ง frontend ("<หน้า>.<การกระทำ>") */
export const PERMISSION_CATALOG: Record<string, string[]> = {
  dashboard: ["view"],
  orders: ["view", "update_status", "payment", "cancel", "export"],
  cashier: ["view", "discount"],
  menu: ["view", "edit", "availability", "delete"],
  tables: ["view", "manage", "print"],
  kitchen: ["view", "update_status"],
  reports: ["view", "export"],
  staff: ["view", "create", "manage", "reset_password", "roles"],
  settings: ["view", "edit"],
};

export const ALL_PERMISSIONS = Object.entries(PERMISSION_CATALOG).flatMap(([resource, actions]) =>
  actions.map((action) => `${resource}.${action}`),
);

const valid = new Set(ALL_PERMISSIONS);

/** ตัดรหัสที่ไม่มีในแคตตาล็อกทิ้ง และบังคับให้มี "<หน้า>.view" ถ้ามีสิทธิ์อื่นของหน้านั้น */
export function normalizePermissions(input: string[]) {
  const set = new Set(input.filter((key) => valid.has(key)));
  for (const key of [...set]) set.add(`${key.split(".")[0]}.view`);
  return [...set];
}

/** บทบาทตั้งต้นที่สร้างให้ทุกร้านเมื่อเปิดหน้าพนักงานครั้งแรก */
export const BUILTIN_ROLES = [
  {
    name: "ผู้จัดการ",
    description: "ดูแลร้านประจำวัน ดูรายงาน และจัดการทีมงาน",
    permissions: [
      "dashboard.view", "orders.view", "orders.update_status", "orders.payment", "orders.cancel", "orders.export",
      "cashier.view", "cashier.discount", "menu.view", "menu.edit", "menu.availability",
      "tables.view", "tables.manage", "tables.print", "kitchen.view", "kitchen.update_status",
      "reports.view", "reports.export", "staff.view", "staff.reset_password", "settings.view",
    ],
  },
  {
    name: "แคชเชียร์",
    description: "รับชำระเงินและดูรายการสั่งอาหาร",
    permissions: ["dashboard.view", "orders.view", "orders.payment", "cashier.view", "tables.view", "menu.view"],
  },
  {
    name: "พ่อครัว",
    description: "ดูออเดอร์ในครัวและเปลี่ยนสถานะการทำอาหาร",
    permissions: ["kitchen.view", "kitchen.update_status", "menu.view", "menu.availability"],
  },
  {
    name: "พนักงานเสิร์ฟ",
    description: "รับออเดอร์หน้าร้านและส่งอาหารให้โต๊ะ",
    permissions: ["orders.view", "orders.update_status", "tables.view", "kitchen.view"],
  },
];
