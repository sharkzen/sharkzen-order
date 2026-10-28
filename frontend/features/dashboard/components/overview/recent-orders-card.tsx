import { Badge } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { formatBaht } from "@/features/dashboard/lib/format";
import { STATUS_BADGE } from "@/features/dashboard/lib/order-status";
import type { RecentOrder } from "@/features/dashboard/types";
import { SectionCard } from "@/features/dashboard/components/shared/section-card";

/** คำสั่งซื้อล่าสุดในรูปแบบตาราง (หมายเลข/เวลา, โต๊ะ, ยอดรวม, สถานะ) */
export function RecentOrdersCard({ orders }: { orders: RecentOrder[] }) {
  return (
    <SectionCard
      title="คำสั่งซื้อล่าสุด"
      action={{ label: "ดูคำสั่งซื้อทั้งหมด →", href: ROUTES.orders }}
      className="min-w-0"
    >
      <div className="flex flex-col gap-3.5">
        <div
          aria-hidden
          className="bg-background text-muted-foreground hidden grid-cols-[1.2fr_0.6fr_1fr_1.4fr] items-center rounded-md py-2 pl-2 text-[11px] sm:grid"
        >
          <span>คำสั่งซื้อ / เวลา</span>
          <span>โต๊ะ</span>
          <span>ยอดรวม</span>
          <span>สถานะ</span>
        </div>
        {orders.length === 0 && (
          <p className="text-muted-foreground py-6 text-center text-xs">
            ไม่พบคำสั่งซื้อในช่วงที่เลือก
          </p>
        )}
        <ul className="flex flex-col gap-3.5">
          {orders.map((order) => {
            const badge = STATUS_BADGE[order.status];
            const Icon = badge.icon;
            return (
              <li
                key={order.id}
                className="grid grid-cols-[1fr_auto] items-center gap-y-1.5 sm:grid-cols-[1.2fr_0.6fr_1fr_1.4fr] sm:gap-y-0 sm:pl-2"
              >
                <div className="flex flex-col leading-[1.6]">
                  <span className="text-foreground text-xs font-semibold">
                    {order.id}
                  </span>
                  <span className="text-muted-foreground text-[10px]">
                    {order.time}
                  </span>
                </div>
                <span className="text-muted-foreground col-span-2 row-start-2 flex gap-3 text-xs sm:contents">
                  <span className="text-foreground">{order.table}</span>
                  <span className="text-foreground">
                    {formatBaht(order.total)}
                  </span>
                </span>
                <span className="col-start-2 row-start-1 justify-self-end sm:col-start-auto sm:row-start-auto sm:justify-self-start">
                  <Badge tone={badge.tone}>
                    <Icon className="size-[13px]" aria-hidden />
                    {badge.label}
                  </Badge>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </SectionCard>
  );
}
