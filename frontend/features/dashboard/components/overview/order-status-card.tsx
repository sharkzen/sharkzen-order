import { cn } from "@/lib/cn";
import { STATUS_COLOR } from "../../lib/order-status";
import type { OrderStatusCount } from "../../types";
import { SectionCard } from "../shared/section-card";
import { StatusDonut } from "./status-donut";

/** สถานะคำสั่งซื้อวันนี้: แผนภูมิวงแหวนและตารางจำนวน/สัดส่วน */
export function OrderStatusCard({
  statuses,
}: {
  statuses: OrderStatusCount[];
}) {
  const total = statuses.reduce((sum, { count }) => sum + count, 0);

  return (
    <SectionCard title="สถานะคำสั่งซื้อ">
      <div className="flex flex-col gap-[18px]">
        <StatusDonut statuses={statuses} total={total} />
        <ul className="flex flex-col gap-2">
          {statuses.map(({ status, label, count }) => (
            <li key={status} className="flex items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  "size-2 shrink-0 rounded-full bg-current",
                  STATUS_COLOR[status],
                )}
              />
              <span className="text-muted-foreground flex-1 text-xs">
                {label}
              </span>
              <span className="text-foreground text-xs font-semibold">
                {count}
              </span>
              <span className="text-muted-foreground w-9 text-right text-[11px]">
                {Math.round((count / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </SectionCard>
  );
}
