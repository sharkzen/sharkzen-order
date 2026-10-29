import { Button } from "@/components/ui";
import { formatBaht } from "@/features/dashboard/lib/format";
import { countItems, summarizeItems } from "@/features/order-management/lib/order-utils";
import type { ManagedOrder } from "@/features/order-management/types";
import { FoodStatusBadge, PaymentBadge } from "./order-badges";

/** ความกว้างคอลัมน์ของตาราง ใช้ร่วมกับหัวตาราง (ตั้งแต่ xl ขึ้นไป) */
export const ORDER_GRID =
  "xl:grid xl:grid-cols-[148px_72px_52px_minmax(0,1fr)_88px_140px_128px_104px] xl:gap-x-3 xl:items-center";

/**
 * แถวคำสั่งซื้อหนึ่งรายการ
 * จอใหญ่: แถวตาราง 8 คอลัมน์ / จอเล็ก: การ์ด (xl:contents ทำให้ลูกกลายเป็นคอลัมน์ของ grid)
 */
export function OrderRow({ order, onView }: { order: ManagedOrder; onView: (order: ManagedOrder) => void }) {
  return (
    <li
      className={`border-border flex flex-col gap-3 border-b px-4 py-4 sm:px-5 xl:min-h-[90px] xl:gap-0 xl:py-3.5 ${ORDER_GRID}`}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 xl:contents">
        <span className="text-primary-strong text-[13px] font-semibold whitespace-nowrap">
          {order.code}
        </span>
        <span className="text-foreground flex flex-col text-xs">
          {order.time} น.
          {order.date && <span className="text-muted-foreground text-[11px]">{order.date}</span>}
        </span>
        <span className="text-foreground text-sm font-medium">
          {order.table}
        </span>
      </div>

      <div className="flex min-w-0 flex-col gap-0.5 xl:pr-5">
        <p className="text-foreground text-[13px]">
          {summarizeItems(order.items)}
        </p>
        <p className="text-muted-foreground text-[11px]">
          {countItems(order.items)} รายการ
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 xl:contents">
        <span className="text-foreground text-[13px] font-semibold">
          {formatBaht(order.total)}
        </span>
        <PaymentBadge
          status={order.paymentStatus}
          method={order.paymentMethod}
          cancelled={order.status === "cancelled"}
        />
        {/* เว้นท้ายเท่าความสูงข้อความช่องทางชำระเงิน เพื่อให้ป้ายสถานะอาหารอยู่ระดับเดียวกับป้ายการชำระเงิน */}
        <div className="xl:pb-5">
          <FoodStatusBadge status={order.status} />
        </div>
        <div className="ml-auto flex items-center gap-2 xl:ml-0">
          <Button variant="outline" size="sm" className="h-[38px]" onClick={() => onView(order)}>
            ดูรายการ
          </Button>
        </div>
      </div>
    </li>
  );
}
