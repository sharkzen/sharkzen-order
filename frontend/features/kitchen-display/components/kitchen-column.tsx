import { cn } from "@/lib/cn";
import { COLUMN_BY_STATUS } from "../lib/columns";
import type { KitchenOrder, KitchenStatus } from "../types";
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
  const count = searching ? `${orders.length}/${total}` : String(total);

  return (
    <section
      aria-label={`คอลัมน์${column.title}`}
      className="flex min-h-0 min-w-0 flex-col gap-3"
    >
      <header
        className={cn(
          "flex h-12 shrink-0 items-center gap-2.5 rounded-xl border-b-[3px] px-4",
          column.headerClassName,
        )}
      >
        <Icon className={cn("size-5", column.iconClassName)} />
        <h2 className="font-display text-foreground min-w-0 flex-1 text-lg font-semibold">
          {column.title}
        </h2>
        <span
          aria-label={`${count} งาน`}
          className="bg-surface text-foreground font-display flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-sm font-semibold tabular-nums"
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
