import { cn } from "@/lib/cn";
import { STATUS_COLOR } from "@/features/dashboard/lib/order-status";
import type { OrderStatusCount } from "@/features/dashboard/types";

const SIZE = 154;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** ช่องว่างระหว่างส่วนโค้ง (px) เพื่อให้แต่ละสถานะแยกกันชัด */
const GAP = 3;

interface StatusDonutProps {
  statuses: OrderStatusCount[];
  total: number;
}

/** แผนภูมิวงแหวนสัดส่วนสถานะ เรียงตามเข็มนาฬิกาเริ่มจากบนสุด */
export function StatusDonut({ statuses, total }: StatusDonutProps) {
  // คำนวณจุดเริ่มของแต่ละส่วนโค้งล่วงหน้า (ผลรวมสะสมของส่วนก่อนหน้า)
  const arcs = statuses
    .filter(({ count }) => count > 0)
    .map(({ status, count }, index, list) => {
      const before = list
        .slice(0, index)
        .reduce((sum, item) => sum + item.count, 0);
      const length = (count / total) * CIRCUMFERENCE;
      return {
        status,
        dash: Math.max(length - GAP, 1),
        offset: (before / total) * CIRCUMFERENCE,
      };
    });

  return (
    <div
      className="relative mx-auto flex items-center justify-center"
      style={{ width: SIZE, height: SIZE }}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="-rotate-90"
        aria-hidden
      >
        {arcs.map(({ status, dash, offset }) => (
          <circle
            key={status}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
            strokeDashoffset={-offset}
            className={cn(STATUS_COLOR[status])}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-foreground text-[32px] leading-[1.3] font-semibold">
          {total}
        </span>
        <span className="text-muted-foreground text-[11px]">
          คำสั่งซื้อวันนี้
        </span>
      </div>
    </div>
  );
}
