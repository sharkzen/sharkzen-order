"use client";

import type { ComponentProps, Ref } from "react";
import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ListPlus, Pencil, Trash2 } from "lucide-react";
import { PiStarBold, PiStarFill } from "react-icons/pi";
import { Switch } from "@/components/ui";
import { cn } from "@/lib/cn";
import { MENU_IMAGE_SIZE, type MenuItem } from "@/features/menu-management/types";

/** คอลัมน์ของตาราง ใช้ร่วมกับหัวตาราง (ตั้งแต่ xl ขึ้นไป) */
export const MENU_GRID =
  "xl:grid xl:grid-cols-[36px_82px_minmax(0,1fr)_106px_182px_164px] xl:items-center";

export interface MenuRowActions {
  onToggle: (id: string, available: boolean) => void;
  onToggleFeatured: (id: string, featured: boolean) => void;
  onEdit: (menu: MenuItem) => void;
  onDelete: (menu: MenuItem) => void;
}

interface MenuRowBodyProps extends MenuRowActions {
  menu: MenuItem;
  /** ปุ่มจับลาก (ไม่มี = ลากไม่ได้ เช่น ขณะค้นหาหรือกรองอยู่) */
  handle?: ComponentProps<"button"> & { ref?: Ref<HTMLButtonElement> };
  className?: string;
  style?: React.CSSProperties;
  rowRef?: Ref<HTMLLIElement>;
  dragging?: boolean;
}

/**
 * เมนูหนึ่งรายการ
 * จอใหญ่: แถวตาราง 6 คอลัมน์ / จอเล็ก: การ์ด (รูป + ชื่อ ด้านบน, สวิตช์ + ปุ่มจัดการ ด้านล่าง)
 */
export function MenuRowBody({
  menu,
  handle,
  className,
  style,
  rowRef,
  dragging,
  onToggle,
  onToggleFeatured,
  onEdit,
  onDelete,
}: MenuRowBodyProps) {
  const { name, description, price, available, featured, image, optionGroups } = menu;

  return (
    <li
      ref={rowRef}
      style={style}
      className={cn(
        "border-border bg-surface relative grid grid-cols-[28px_62px_minmax(0,1fr)] gap-x-3 gap-y-3 border-b px-4 py-4 sm:px-[22px]",
        MENU_GRID,
        "xl:gap-x-0 xl:gap-y-0",
        dragging && "shadow-float z-10 rounded-lg opacity-95",
        className,
      )}
    >
      <button
        type="button"
        aria-label={handle ? `ลากเพื่อจัดลำดับ ${name}` : "ลากเรียงลำดับไม่ได้ขณะค้นหาหรือกรอง"}
        disabled={!handle}
        {...handle}
        className={cn(
          "text-muted-foreground focus-visible:ring-primary/50 flex size-8 touch-none items-center justify-center self-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none",
          handle ? "hover:bg-muted cursor-grab active:cursor-grabbing" : "cursor-not-allowed opacity-30",
        )}
      >
        <GripVertical className="size-[18px]" aria-hidden />
      </button>

      {image ? (
        <Image
          src={image}
          alt=""
          width={62}
          height={62}
          unoptimized
          className={cn(
            "size-[62px] rounded-[10px] object-cover",
            !available && "opacity-60 grayscale-[40%]",
          )}
        />
      ) : (
        <span
          aria-hidden
          className="bg-primary-soft text-primary-strong flex size-[62px] flex-col items-center justify-center rounded-[10px] text-center text-[10px] leading-tight font-semibold"
        >
          {MENU_IMAGE_SIZE.width}×{MENU_IMAGE_SIZE.height}
          <span className="font-medium opacity-80">px</span>
        </span>
      )}

      <div className="flex min-w-0 flex-col gap-1 xl:pr-6">
        <p className="text-foreground text-sm font-semibold">{name}</p>
        {description && <p className="text-muted-foreground text-[11px]">{description}</p>}
        {optionGroups.length > 0 && (
          <p className="text-primary-strong flex items-center gap-1 text-[11px] font-medium">
            <ListPlus className="size-3.5" aria-hidden />
            ตัวเลือก {optionGroups.map((group) => group.name).join(", ")}
          </p>
        )}
        <p className="text-foreground mt-0.5 text-xs font-semibold xl:hidden">{price} บาท</p>
      </div>

      <p className="text-foreground hidden text-sm font-semibold xl:block">{price} บาท</p>

      <div className="col-span-3 flex items-center justify-between gap-3 xl:contents">
        <div className="flex items-center gap-2.5">
          <Switch
            checked={available}
            onCheckedChange={(checked) => onToggle(menu.id, checked)}
            aria-label={`${name} ${available ? "พร้อมขาย" : "หมดชั่วคราว"} (กดเพื่อสลับสถานะ)`}
          />
          <span className={cn("text-xs", available ? "text-success-strong" : "text-muted-foreground")}>
            {available ? "พร้อมขาย" : "หมดชั่วคราว"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-pressed={featured}
            aria-label={featured ? `เอา ${name} ออกจากเมนูแนะนำ` : `แนะนำ ${name}`}
            title={featured ? "เมนูแนะนำ (กดเพื่อยกเลิก)" : "แนะนำเมนูนี้"}
            onClick={() => onToggleFeatured(menu.id, !featured)}
            className={cn(
              "focus-visible:ring-primary/50 flex size-[38px] cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none",
              featured
                ? "bg-warning-soft text-warning-strong hover:bg-warning-soft/70"
                : "bg-muted text-muted-foreground hover:bg-primary-soft hover:text-primary-strong",
            )}
          >
            {featured ? <PiStarFill className="size-5" aria-hidden /> : <PiStarBold className="size-5" aria-hidden />}
          </button>
          <button
            type="button"
            aria-label={`แก้ไข ${name}`}
            onClick={() => onEdit(menu)}
            className="bg-primary-soft text-primary hover:bg-primary-muted focus-visible:ring-primary/50 flex size-[38px] cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <Pencil className="size-[17px]" aria-hidden />
          </button>
          <button
            type="button"
            aria-label={`ลบ ${name}`}
            onClick={() => onDelete(menu)}
            className="bg-danger-soft text-danger hover:bg-danger/15 focus-visible:ring-danger/50 flex size-[38px] cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <Trash2 className="size-[17px]" aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}

interface SortableMenuRowProps extends MenuRowActions {
  menu: MenuItem;
  /** false = ปิดการลาก (ขณะค้นหาหรือกรอง ลำดับที่เห็นไม่ใช่ลำดับจริง) */
  sortable: boolean;
}

/** แถวเมนูที่ลากจัดลำดับได้ด้วย dnd-kit (รองรับเมาส์ สัมผัส และคีย์บอร์ด) */
export function SortableMenuRow({ sortable, menu, ...actions }: SortableMenuRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: menu.id, disabled: !sortable });

  return (
    <MenuRowBody
      menu={menu}
      {...actions}
      rowRef={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && "opacity-40")}
      handle={sortable ? { ...attributes, ...listeners, ref: setActivatorNodeRef } : undefined}
    />
  );
}
