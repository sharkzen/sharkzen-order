import { SectionCard } from "@/features/dashboard/components/shared/section-card";
import { formatNumber } from "@/features/dashboard/lib/format";
import { PAYMENT_METHOD_LABEL } from "@/features/order-management/lib/labels";
import type { PaymentMethod } from "@/features/order-management/types";

/** สีช่องทางชำระเงิน ผ่านการตรวจความต่างสี (รวมกรณีตาบอดสี) และมีป้ายชื่อ+ตัวเลขกำกับทุกช่องทาง */
const METHOD_COLOR: Record<PaymentMethod, string> = {
  transfer: "#2563eb",
  cash: "#0d9488",
  counter: "#d97706",
};

const METHOD_ORDER: PaymentMethod[] = ["transfer", "cash", "counter"];

/** สัดส่วนยอดขายตามช่องทางชำระเงิน ช่วยดูว่าต้องเตรียมเงินทอนหรือไม่ */
export function PaymentMixCard({
  totals,
}: {
  totals: Record<PaymentMethod, number>;
}) {
  const total = METHOD_ORDER.reduce((sum, method) => sum + totals[method], 0);
  const percentOf = (method: PaymentMethod) =>
    total > 0 ? Math.round((totals[method] / total) * 100) : 0;

  return (
    <SectionCard title="ช่องทางชำระเงิน" className="min-w-0">
      <div
        role="img"
        aria-label={`สัดส่วนยอดขายตามช่องทางชำระเงิน ${METHOD_ORDER.map(
          (method) => `${PAYMENT_METHOD_LABEL[method]} ${percentOf(method)}%`,
        ).join(" ")}`}
        className="flex h-3.5 gap-[2px] overflow-hidden rounded-full"
      >
        {METHOD_ORDER.map((method) => (
          <span
            key={method}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${total > 0 ? (totals[method] / total) * 100 : 0}%`,
              backgroundColor: METHOD_COLOR[method],
            }}
          />
        ))}
      </div>

      <ul className="flex flex-col gap-3">
        {METHOD_ORDER.map((method) => (
          <li
            key={method}
            className="flex items-center justify-between gap-3 text-[13px]"
          >
            <span className="text-foreground flex items-center gap-2.5">
              <span
                aria-hidden
                className="size-2.5 rounded-[3px]"
                style={{ backgroundColor: METHOD_COLOR[method] }}
              />
              {PAYMENT_METHOD_LABEL[method]}
            </span>
            <span className="flex items-baseline gap-2 tabular-nums">
              <span className="text-foreground font-semibold">
                {formatNumber(totals[method])} บาท
              </span>
              <span className="text-muted-foreground w-9 text-right text-xs">
                {percentOf(method)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
