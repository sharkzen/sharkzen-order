import { Search } from "lucide-react";
import { Card, DatePicker, FilterField, Input, Select } from "@/components/ui";
import { PAYMENT_OPTIONS, STATUS_OPTIONS } from "@/features/order-management/lib/labels";
import type { PaymentFilter, StatusFilter } from "@/features/order-management/types";

interface OrderFiltersProps {
  query: string;
  status: StatusFilter;
  payment: PaymentFilter;
  /** วันที่ดูอยู่ YYYY-MM-DD */
  date: string;
  maxDate: string;
  onDateChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onPaymentChange: (value: PaymentFilter) => void;
}

/** แถบค้นหาและกรอง: ค้นหา วันที่ สถานะการชำระเงิน และสถานะคำสั่งซื้อ */
export function OrderFilters({
  query,
  status,
  payment,
  date,
  maxDate,
  onDateChange,
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
        <DatePicker id="order-date" size="lg" value={date} max={maxDate} onChange={onDateChange} />
      </FilterField>

      <FilterField label="สถานะการชำระเงิน" htmlFor="order-payment">
        <Select
          size="lg"
          id="order-payment"
          value={payment}
          options={PAYMENT_OPTIONS}
          onChange={(v) => onPaymentChange(v as PaymentFilter)}
        />
      </FilterField>

      <FilterField label="สถานะคำสั่งซื้อ" htmlFor="order-status">
        <Select
          size="lg"
          id="order-status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={(v) => onStatusChange(v as StatusFilter)}
        />
      </FilterField>
    </Card>
  );
}
