import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { MenuItem } from "../types";

/** คอลัมน์ของตาราง ใช้ร่วมกับหัวตาราง (ตั้งแต่ xl ขึ้นไป) */
export const MENU_GRID =
  "xl:grid xl:grid-cols-[82px_minmax(0,1fr)_148px_106px_182px_120px] xl:items-center";

interface MenuRowProps {
  menu: MenuItem;
  onToggle: (id: string, available: boolean) => void;
  onDelete: (menu: MenuItem) => void;
}

/**
 * เมนูหนึ่งรายการ
 * จอใหญ่: แถวตาราง 6 คอลัมน์ / จอเล็ก: การ์ด (รูป + ชื่อ ด้านบน, สวิตช์ + ปุ่มจัดการ ด้านล่าง)
 */
export function MenuRow({ menu, onToggle, onDelete }: MenuRowProps) {
  const { name, description, category, price, available } = menu;

  return (
    <li
      className={cn(
        "border-border grid grid-cols-[62px_minmax(0,1fr)] gap-x-4 gap-y-3 border-b px-4 py-4 sm:px-[22px]",
        MENU_GRID,
        "xl:gap-x-0 xl:gap-y-0",
      )}
    >
      <Image
        src={menu.image}
        alt=""
        width={62}
        height={62}
        className={cn(
          "size-[62px] rounded-[10px] object-cover",
          !available && "opacity-60 grayscale-[40%]",
        )}
      />

      <div className="flex min-w-0 flex-col gap-1 xl:pr-6">
        <p className="text-foreground text-sm font-semibold">{name}</p>
        <p className="text-muted-foreground text-[11px]">{description}</p>
        <p className="text-muted-foreground mt-0.5 text-xs xl:hidden">
          {category} •{" "}
          <span className="text-foreground font-semibold">{price} บาท</span>
        </p>
      </div>

      <p className="text-muted-foreground hidden text-xs xl:block">
        {category}
      </p>
      <p className="text-foreground hidden text-sm font-semibold xl:block">
        {price} บาท
      </p>

      <div className="col-span-2 flex items-center justify-between gap-3 xl:contents">
        <div className="flex items-center gap-2.5">
          <Switch
            checked={available}
            onCheckedChange={(checked) => onToggle(menu.id, checked)}
            aria-label={`${name} ${available ? "พร้อมขาย" : "หมดชั่วคราว"} (กดเพื่อสลับสถานะ)`}
          />
          <span
            className={cn(
              "text-xs",
              available ? "text-success-strong" : "text-muted-foreground",
            )}
          >
            {available ? "พร้อมขาย" : "หมดชั่วคราว"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={`แก้ไข ${name}`}
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
