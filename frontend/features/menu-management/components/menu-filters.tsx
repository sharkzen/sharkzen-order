import { Search } from "lucide-react";
import { Card, FilterField, FilterSelect, Input } from "@/components/ui";
import { SALE_OPTIONS } from "../lib/menu-utils";
import type { SaleFilter } from "../types";

interface MenuFiltersProps {
  query: string;
  category: string;
  sale: SaleFilter;
  categories: string[];
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSaleChange: (value: SaleFilter) => void;
}

/** ค้นหาเมนู กรองตามหมวดหมู่ และสถานะการขาย */
export function MenuFilters({
  query,
  category,
  sale,
  categories,
  onQueryChange,
  onCategoryChange,
  onSaleChange,
}: MenuFiltersProps) {
  const categoryOptions = [
    { value: "", label: "ทุกหมวดหมู่" },
    ...categories.map((name) => ({ value: name, label: name })),
  ];

  return (
    <Card className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,246px)_minmax(0,246px)]">
      <div className="sm:col-span-2 xl:col-span-1">
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
      </div>

      <FilterField label="หมวดหมู่" htmlFor="menu-category">
        <FilterSelect
          id="menu-category"
          value={category}
          options={categoryOptions}
          onChange={(e) => onCategoryChange(e.target.value)}
        />
      </FilterField>

      <FilterField label="สถานะการขาย" htmlFor="menu-sale">
        <FilterSelect
          id="menu-sale"
          value={sale}
          options={SALE_OPTIONS}
          onChange={(e) => onSaleChange(e.target.value as SaleFilter)}
        />
      </FilterField>
    </Card>
  );
}
