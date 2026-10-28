import { Search } from "lucide-react";
import { Card, FilterField, Input, Select } from "@/components/ui";
import { SALE_OPTIONS } from "@/features/menu-management/lib/menu-utils";
import type { SaleFilter } from "@/features/menu-management/types";

interface MenuFiltersProps {
  query: string;
  sale: SaleFilter;
  onQueryChange: (value: string) => void;
  onSaleChange: (value: SaleFilter) => void;
}

/** ค้นหาเมนู และกรองตามสถานะการขาย (กรองหมวดหมู่ทำที่แผงหมวดหมู่) */
export function MenuFilters({ query, sale, onQueryChange, onSaleChange }: MenuFiltersProps) {
  return (
    <Card className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,246px)]">
      <FilterField label="ค้นหาเมนูอาหาร" htmlFor="menu-search">
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2"
            aria-hidden
          />
          <Input
            id="menu-search"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="พิมพ์ชื่อเมนูที่ต้องการค้นหา"
            className="h-[46px] rounded-lg pl-11 text-sm"
          />
        </div>
      </FilterField>

      <FilterField label="สถานะการขาย" htmlFor="menu-sale">
        <Select
          size="lg"
          id="menu-sale"
          value={sale}
          options={SALE_OPTIONS}
          onChange={(v) => onSaleChange(v as SaleFilter)}
        />
      </FilterField>
    </Card>
  );
}
