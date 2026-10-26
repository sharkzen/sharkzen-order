import { ChevronsUpDown } from "lucide-react";
import type { ShopInfo } from "../../types";

/** ปุ่มเลือกร้าน/สาขา (รองรับเจ้าของที่มีหลายสาขา) */
export function ShopSwitcher({ shop }: { shop: ShopInfo }) {
  return (
    <button
      type="button"
      className="bg-background hover:bg-primary-soft focus-visible:ring-primary/50 flex w-full cursor-pointer flex-col gap-0.5 rounded-lg p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className="text-muted-foreground text-[11px]">
        พื้นที่จัดการร้าน
      </span>
      <span className="flex items-center justify-between gap-2">
        <span className="text-foreground text-sm font-semibold">
          {shop.name}
        </span>
        <ChevronsUpDown
          className="text-muted-foreground size-[15px] shrink-0"
          aria-hidden
        />
      </span>
      <span className="text-muted-foreground text-[11px]">{shop.branch}</span>
    </button>
  );
}
