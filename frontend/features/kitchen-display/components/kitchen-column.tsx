import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import { COLUMN_BY_STATUS } from "@/features/kitchen-display/lib/columns";
import { isUrgent } from "@/features/kitchen-display/lib/kitchen-utils";
import type { KitchenOrder, KitchenStatus } from "@/features/kitchen-display/types";
import { KitchenOrderCard } from "./kitchen-order-card";

interface KitchenColumnProps {
  status: KitchenStatus;
  orders: KitchenOrder[];
  /** จำนวนงานทั้งหมดในสถานะนี้ (ก่อนกรองด้วยคำค้น) */
  total: number;
  searching: boolean;
  ticks: number;
  urgentAfter: number;
  onAdvance: (order: KitchenOrder) => void;
  onCancel: (order: KitchenOrder) => void;
  onAcknowledge: (order: KitchenOrder) => void;
  onOpen: (order: KitchenOrder) => void;
}

/**
 * คอลัมน์หนึ่งของกระดาน: หัวคอลัมน์ติดอยู่ด้านบน การ์ดเลื่อนอยู่ในคอลัมน์เอง
 * จึงรองรับงานจำนวนมากโดยหัวคอลัมน์และปุ่มต่างๆ ไม่หลุดจากหน้าจอ
 */
export function KitchenColumn({
  status,
  orders,
  total,
  searching,
  ticks,
  urgentAfter,
  onAdvance,
  onCancel,
  onAcknowledge,
  onOpen,
}: KitchenColumnProps) {
  const column = COLUMN_BY_STATUS[status];
  const Icon = column.icon;
  const urgentCount = orders.filter((o) =>
    isUrgent(o, ticks, urgentAfter),
  ).length;
  const count = searching ? `${orders.length}/${total}` : String(total);

  return (
    <section
      aria-label={`คอลัมน์${column.title}`}
      className="flex min-h-0 min-w-0 flex-col gap-3"
    >
      <header className="border-border flex shrink-0 items-center gap-3 border-b pb-3">
        <span
          aria-hidden
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            column.chipClassName,
          )}
        >
          <Icon className="size-5" />
        </span>
        <h2 className="font-display text-foreground min-w-0 flex-1 text-xl font-semibold">
          {column.title}
        </h2>
        {urgentCount > 0 && (
          <span className="bg-danger-soft text-danger-strong flex h-7 items-center gap-1 rounded-full px-2.5 text-sm font-semibold">
            <TriangleAlert className="size-3.5" aria-hidden />
            เร่งด่วน {urgentCount}
          </span>
        )}
        <span
          aria-label={`${count} งาน`}
          className={cn(
            "font-display text-3xl leading-none font-semibold tabular-nums",
            column.countClassName,
          )}
        >
          {count}
        </span>
      </header>

      <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1.5 pb-1">
        {orders.length === 0 && (
          <p className="border-border text-muted-foreground shrink-0 rounded-xl border border-dashed px-4 py-8 text-center text-sm">
            {searching ? "ไม่พบงานที่ตรงกับคำค้นหา" : column.emptyText}
          </p>
        )}
        {orders.map((order) => (
          <KitchenOrderCard
            key={order.id}
            order={order}
            ticks={ticks}
            urgentAfter={urgentAfter}
            onAdvance={onAdvance}
            onCancel={onCancel}
            onAcknowledge={onAcknowledge}
            onOpen={onOpen}
          />
        ))}
      </div>
    </section>
  );
}
