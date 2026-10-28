"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { EyeOff, Plus } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { MenuItem } from "@/features/menu-management/types";
import { MENU_GRID, SortableMenuRow, type MenuRowActions } from "./menu-row";

const COLUMNS = ["", "รูปอาหาร", "ชื่อเมนูอาหาร", "ราคา", "สถานะการขาย", "จัดการ"];

interface MenuSectionProps extends MenuRowActions {
  /** รหัสพื้นที่ลาก (รหัสหมวด หรือ NO_CATEGORY) */
  id: string;
  title: string;
  hidden?: boolean;
  /** ทุกเมนูของหมวดนี้ (เรียงตามลำดับ) สำหรับนับจำนวน */
  total: number;
  /** เมนูที่แสดงจริงหลังกรอง เรียงตามลำดับในกระดาน */
  menus: MenuItem[];
  sortable: boolean;
  onAdd: () => void;
}

/** หมวดหนึ่งหมวด: หัวหมวด + รายการเมนูที่ลากเรียงได้ และลากข้ามมาวางในหมวดว่างได้ */
export function MenuSection({
  id,
  title,
  hidden,
  total,
  menus,
  sortable,
  onAdd,
  ...actions
}: MenuSectionProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-border flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-3.5 sm:px-[22px]">
        <div className="flex items-center gap-2.5">
          <h2 className="text-foreground text-[17px] font-semibold">{title}</h2>
          <Badge tone="info">{total} เมนู</Badge>
          {hidden && (
            <Badge tone="warning">
              <EyeOff className="size-3.5" aria-hidden />
              ซ่อนจากลูกค้า
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="size-4" aria-hidden />
          เพิ่มเมนูในหมวดนี้
        </Button>
      </div>

      <div
        aria-hidden
        className={`bg-background text-muted-foreground hidden px-[22px] py-3 text-xs font-medium ${MENU_GRID}`}
      >
        {COLUMNS.map((column, index) => (
          <span key={`${column}-${index}`}>{column}</span>
        ))}
      </div>

      <SortableContext items={menus.map((menu) => menu.id)} strategy={verticalListSortingStrategy}>
        <ul
          ref={setNodeRef}
          className={cn("min-h-[64px] transition-colors", isOver && "bg-primary-soft/50")}
        >
          {menus.map((menu) => (
            <SortableMenuRow key={menu.id} menu={menu} sortable={sortable} {...actions} />
          ))}
          {menus.length === 0 && (
            <li className="text-muted-foreground px-[22px] py-5 text-center text-[13px]">
              {total === 0
                ? "ยังไม่มีเมนูในหมวดนี้ ลากเมนูจากหมวดอื่นมาวาง หรือกดเพิ่มเมนู"
                : "ไม่มีเมนูที่ตรงกับตัวกรองในหมวดนี้"}
            </li>
          )}
        </ul>
      </SortableContext>
    </Card>
  );
}
