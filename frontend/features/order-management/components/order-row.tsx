import { EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui";
import { formatBaht } from "@/features/dashboard/lib/format";
import { countItems, summarizeItems } from "../lib/order-utils";
import type { ManagedOrder } from "../types";
import { FoodStatusBadge, PaymentBadge } from "./order-badges";

/** ความกว้างคอลัมน์ของตาราง ใช้ร่วมกับหัวตาราง (ตั้งแต่ xl ขึ้นไป) */
export const ORDER_GRID =
  "xl:grid xl:grid-cols-[96px_64px_52px_minmax(0,1fr)_88px_140px_128px_104px] xl:gap-x-3 xl:items-center";

/**
 * แถวคำสั่งซื้อหนึ่งรายการ
 * จอใหญ่: แถวตาราง 8 คอลัมน์ / จอเล็ก: การ์ด (xl:contents ทำให้ลูกกลายเป็นคอลัมน์ของ grid)
 */
export function OrderRow({ order }: { order: ManagedOrder }) {
  return (
    <li
      className={`border-border flex flex-col gap-3 border-b px-4 py-4 sm:px-5 xl:min-h-[90px] xl:gap-0 xl:py-3.5 ${ORDER_GRID}`}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 xl:contents">
        <span className="text-primary-strong text-[13px] font-semibold">
          {order.id}
        </span>
        <span className="text-foreground text-xs">{order.time} น.</span>
        <span className="text-foreground text-sm font-medium">
          <span className="font-normal xl:hidden">โต๊ะ </span>
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
        />
        {/* เว้นท้ายเท่าความสูงข้อความช่องทางชำระเงิน เพื่อให้ป้ายสถานะอาหารอยู่ระดับเดียวกับป้ายการชำระเงิน */}
        <div className="xl:pb-5">
          <FoodStatusBadge status={order.status} />
        </div>
        <div className="ml-auto flex items-center gap-2 xl:ml-0">
          <Button variant="outline" size="sm" className="h-[38px]">
            ดูรายการ
          </Button>
          <button
            type="button"
            aria-label={`ตัวเลือกเพิ่มเติมของคำสั่งซื้อ ${order.id}`}
            className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-primary/50 flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <EllipsisVertical className="size-[15px]" aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}
