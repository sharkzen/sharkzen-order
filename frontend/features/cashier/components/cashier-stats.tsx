import { formatNumber } from "@/features/dashboard/lib/format";

interface CashierStatsProps {
  dueTables: number;
  dueAmount: number;
  collectedToday: number;
}

/** แถบตัวเลขสรุปบางๆ เหนือรายการโต๊ะ: รอชำระกี่โต๊ะ ต้องเก็บเท่าไร และเก็บได้แล้วเท่าไร */
export function CashierStats({
  dueTables,
  dueAmount,
  collectedToday,
}: CashierStatsProps) {
  const items = [
    { label: "รอชำระ", value: formatNumber(dueTables), unit: "โต๊ะ" },
    { label: "ยอดรอเก็บ", value: `฿${formatNumber(dueAmount)}`, unit: "" },
    {
      label: "เก็บแล้ววันนี้",
      value: `฿${formatNumber(collectedToday)}`,
      unit: "",
    },
  ];

  return (
    <dl className="border-border bg-surface divide-border grid grid-cols-3 divide-x overflow-hidden rounded-xl border lg:min-w-[520px]">
      {items.map(({ label, value, unit }) => (
        <div key={label} className="flex flex-col gap-0.5 px-4 py-2">
          <dt className="text-muted-foreground text-xs">{label}</dt>
          <dd className="flex items-baseline gap-1.5">
            <span className="font-display text-foreground text-lg leading-tight font-semibold tabular-nums sm:text-xl">
              {value}
            </span>
            {unit && (
              <span className="text-muted-foreground text-xs">{unit}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
