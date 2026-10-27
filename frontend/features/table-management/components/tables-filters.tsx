import { Search } from "lucide-react";
import { Card, FilterField, FilterSelect, Input } from "@/components/ui";
import { STATUS_OPTIONS } from "../lib/table-utils";
import type { StatusFilter } from "../types";

interface TablesFiltersProps {
  query: string;
  zone: string;
  status: StatusFilter;
  zones: string[];
  onQueryChange: (value: string) => void;
  onZoneChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
}

/** ค้นหาโต๊ะ กรองตามโซน และสถานะ (เปิดอยู่ / ว่าง) */
export function TablesFilters({
  query,
  zone,
  status,
  zones,
  onQueryChange,
  onZoneChange,
  onStatusChange,
}: TablesFiltersProps) {
  const zoneOptions = [
    { value: "", label: "ทุกโซน" },
    ...zones.map((name) => ({ value: name, label: name })),
  ];

  return (
    <Card className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,246px)_minmax(0,246px)]">
      <div className="sm:col-span-2 xl:col-span-1">
        <FilterField label="ค้นหาโต๊ะ" htmlFor="table-search">
          <div className="relative">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2"
              aria-hidden
            />
            <Input
              id="table-search"
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="พิมพ์ชื่อโต๊ะ เช่น โต๊ะ 5"
              className="h-[46px] rounded-lg pl-11 text-sm"
            />
          </div>
        </FilterField>
      </div>

      <FilterField label="โซน" htmlFor="table-zone">
        <FilterSelect
          id="table-zone"
          value={zone}
          options={zoneOptions}
          onChange={(e) => onZoneChange(e.target.value)}
        />
      </FilterField>

      <FilterField label="สถานะ" htmlFor="table-status">
        <FilterSelect
          id="table-status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
        />
      </FilterField>
    </Card>
  );
}
