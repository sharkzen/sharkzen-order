import { AnimatedBar } from "@/components/motion/animated-bar";
import { DAILY_REVENUE, PAYMENT_METHODS } from "../../data";

/** สรุปยอดชำระเงินวันนี้แยกตามช่องทาง */
export function PaymentSummary() {
  return (
    <div className="bg-surface flex flex-col gap-4 rounded-xl p-[18px] lg:w-[320px]">
      <div>
        <p className="text-foreground text-sm font-semibold">
          สรุปการชำระเงินวันนี้
        </p>
        <p className="text-muted-foreground text-[11px]">
          รวม {DAILY_REVENUE.toLocaleString("th-TH")} บาท แยกตามช่องทาง
        </p>
      </div>
      <ul className="flex flex-col gap-3.5">
        {PAYMENT_METHODS.map(({ id, label, icon: Icon, amount }, index) => {
          const percent = Math.round((amount / DAILY_REVENUE) * 100);
          return (
            <li key={id} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-xs">
                <Icon className="text-primary size-3.5 shrink-0" aria-hidden />
                <span className="text-foreground flex-1">{label}</span>
                <span className="text-foreground font-semibold">
                  ฿{amount.toLocaleString("th-TH")}
                </span>
                <span className="text-muted-foreground w-9 text-right">
                  {percent}%
                </span>
              </div>
              <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                <AnimatedBar
                  axis="x"
                  delay={index * 0.08}
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
