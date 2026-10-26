import type { MenuItem } from "../types";
import { MENU_GRID, MenuRow } from "./menu-row";

const COLUMNS = [
  "รูปอาหาร",
  "ชื่อเมนูอาหาร",
  "หมวดหมู่",
  "ราคา",
  "สถานะการขาย",
  "จัดการ",
];

interface MenuListProps {
  menus: MenuItem[];
  onToggle: (id: string, available: boolean) => void;
  onDelete: (menu: MenuItem) => void;
}

/** รายการเมนูของหน้านั้น: หัวตารางแสดงเฉพาะจอใหญ่ จอเล็กเป็นการ์ด */
export function MenuList({ menus, onToggle, onDelete }: MenuListProps) {
  return (
    <div>
      <div
        aria-hidden
        className={`bg-background text-muted-foreground hidden px-[22px] py-[15px] text-xs font-medium ${MENU_GRID}`}
      >
        {COLUMNS.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      <ul>
        {menus.map((menu) => (
          <MenuRow
            key={menu.id}
            menu={menu}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </div>
  );
}
