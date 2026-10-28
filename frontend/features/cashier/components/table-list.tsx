import { Search, SearchX, Utensils } from "lucide-react";
import { EmptyState, Input, Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { CheckoutConfig, TableBill } from "@/features/cashier/types";
import { TableTile } from "./table-tile";

export type TableView = "due" | "all";

interface TableListProps {
  bills: TableBill[];
  config: Pick<CheckoutConfig, "serviceChargePercent">;
  view: TableView;
  query: string;
  dueCount: number;
  totalCount: number;
  selectedId: string | null;
  /** โซนที่มีโต๊ะเปิดอยู่ ใช้กรอง ("" = ทุกโซน) */
  zones: string[];
  zone: string;
  onZoneChange: (zone: string) => void;
  onViewChange: (view: TableView) => void;
  onQueryChange: (query: string) => void;
  onSelect: (bill: TableBill) => void;
}

/** ตัวกรอง ช่องค้นหา และตารางช่องโต๊ะ (bills ที่ส่งเข้ามากรองและเรียงแล้ว) */
export function TableList({
  bills,
  config,
  view,
  query,
  dueCount,
  totalCount,
  selectedId,
  zones,
  zone,
  onZoneChange,
  onViewChange,
  onQueryChange,
  onSelect,
}: TableListProps) {
  const tabs: { value: TableView; label: string; count: number }[] = [
    { value: "due", label: "รอชำระ", count: dueCount },
    { value: "all", label: "ทุกโต๊ะ", count: totalCount },
  ];

  return (
    <section
      aria-label="รายการโต๊ะ"
      className="flex min-h-0 min-w-0 flex-col gap-3"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="group"
          aria-label="กรองโต๊ะ"
          className="bg-muted grid auto-cols-fr grid-flow-col gap-1 rounded-lg p-1 sm:w-[280px]"
        >
          {tabs.map((tab) => {
            const active = tab.value === view;
            return (
              <button
                key={tab.value}
                type="button"
                aria-pressed={active}
                onClick={() => onViewChange(tab.value)}
                className={cn(
                  "focus-visible:ring-primary/50 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md text-[13px] font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  active
                    ? "bg-surface text-primary-strong shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                <span className="bg-background rounded-[5px] px-1.5 py-px text-[11px]">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:justify-end">
        {zones.length > 1 && (
          <Select
            aria-label="กรองตามโซน"
            className="sm:w-[180px]"
            value={zone}
            onChange={onZoneChange}
            options={[{ value: "", label: "ทุกโซน" }, ...zones.map((name) => ({ value: name, label: name }))]}
          />
        )}
        <div className="relative sm:w-[220px]">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            type="search"
            aria-label="ค้นหาโต๊ะ"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="ค้นหาโต๊ะ เช่น 5"
            className="h-11 pl-9"
          />
        </div>
        </div>
      </div>

      {bills.length > 0 ? (
        <ul className="scroll-thin grid min-h-0 flex-1 grid-cols-[repeat(auto-fill,minmax(230px,1fr))] content-start gap-3 overflow-y-auto p-1 pr-2">
          {bills.map((bill) => (
            <li key={bill.tableId}>
              <TableTile
                bill={bill}
                config={config}
                selected={bill.tableId === selectedId}
                onSelect={onSelect}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="border-border bg-surface rounded-xl border">
          {query ? (
            <EmptyState
              icon={<SearchX className="size-6" aria-hidden />}
              title="ไม่พบโต๊ะที่ค้นหา"
              description="ลองพิมพ์เลขโต๊ะหรือชื่อโซนใหม่ หรือเลือก ทุกโต๊ะ"
              actionLabel="ล้างการค้นหา"
              onAction={() => onQueryChange("")}
            />
          ) : (
            <EmptyState
              icon={<Utensils className="size-6" aria-hidden />}
              title={
                view === "due" ? "ไม่มีโต๊ะรอชำระ" : "ยังไม่มีโต๊ะที่เปิดอยู่"
              }
              description="เมื่อลูกค้าสั่งอาหาร โต๊ะจะขึ้นที่นี่เพื่อรอคิดเงิน"
            />
          )}
        </div>
      )}
    </section>
  );
}
