import { CalendarDays, Search } from "lucide-react";
import { Card, FilterField, FilterSelect, Input } from "@/components/ui";
import { PAYMENT_OPTIONS, STATUS_OPTIONS } from "../lib/labels";
import type { PaymentFilter, StatusFilter } from "../types";

interface OrderFiltersProps {
  query: string;
  status: StatusFilter;
  payment: PaymentFilter;
  dateLabel: string;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onPaymentChange: (value: PaymentFilter) => void;
}

/** แถบค้นหาและกรอง: ค้นหา วันที่ สถานะการชำระเงิน และสถานะคำสั่งซื้อ */
export function OrderFilters({
  query,
  status,
  payment,
  dateLabel,
  onQueryChange,
  onStatusChange,
  onPaymentChange,
}: OrderFiltersProps) {
  return (
    <Card className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_214px_196px_178px]">
      <div className="sm:col-span-2 xl:col-span-1">
        <FilterField label="ค้นหาคำสั่งซื้อ" htmlFor="order-search">
          <div className="relative">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2"
              aria-hidden
            />
            <Input
              id="order-search"
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="ค้นหาเลขคำสั่งซื้อ หรือหมายเลขโต๊ะ"
              className="h-[46px] rounded-lg pl-11 text-sm"
            />
          </div>
        </FilterField>
      </div>

      <FilterField label="วันที่สั่งอาหาร" htmlFor="order-date">
        <button
          id="order-date"
          type="button"
          className="border-border bg-surface hover:bg-muted focus-visible:ring-primary/50 flex h-[46px] w-full cursor-pointer items-center justify-between gap-3 rounded-lg border px-3.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <span className="text-muted-foreground">{dateLabel}</span>
          <CalendarDays className="text-muted-foreground size-4" aria-hidden />
        </button>
      </FilterField>

      <FilterField label="สถานะการชำระเงิน" htmlFor="order-payment">
        <FilterSelect
          id="order-payment"
          value={payment}
          options={PAYMENT_OPTIONS}
          onChange={(e) => onPaymentChange(e.target.value as PaymentFilter)}
        />
      </FilterField>

      <FilterField label="สถานะคำสั่งซื้อ" htmlFor="order-status">
        <FilterSelect
          id="order-status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
        />
      </FilterField>
    </Card>
  );
}
