import Image from "next/image";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  DEMO_ORDER_ITEMS,
  DEMO_ORDER_TOTAL,
  DEMO_RESTAURANT,
  DEMO_TABLE,
} from "@/features/landing/data";

/** จอมือถือของลูกค้า: เลือกเมนูแล้วกดสั่ง */
export function PhonePanel({ sent }: { sent: boolean }) {
  return (
    <div className="border-border bg-surface shadow-float mx-auto w-full max-w-[270px] rounded-[28px] border p-2.5">
      <div className="bg-background flex h-full flex-col gap-3.5 rounded-[20px] p-4">
        <div>
          <p className="text-muted-foreground text-[11px]">
            {DEMO_RESTAURANT.name}
          </p>
          <p className="font-display text-foreground text-base font-semibold">
            {DEMO_TABLE}
          </p>
        </div>

        <ul className="flex flex-col gap-2">
          {DEMO_ORDER_ITEMS.map((item) => (
            <li key={item.name} className="flex items-center gap-2">
              <Image
                src={item.image}
                alt=""
                width={44}
                height={44}
                className="size-11 shrink-0 rounded-lg object-cover"
              />
              <span className="text-foreground min-w-0 flex-1 text-xs leading-snug">
                {item.name}
              </span>
              <span className="text-foreground text-xs font-semibold">
                {item.price}
              </span>
            </li>
          ))}
        </ul>

        <div className="border-border flex items-center justify-between border-t pt-2">
          <span className="text-muted-foreground text-xs">
            รวม {DEMO_ORDER_ITEMS.length} รายการ
          </span>
          <span className="text-foreground text-base font-bold">
            ฿{DEMO_ORDER_TOTAL}
          </span>
        </div>

        <div
          className={cn(
            "flex h-10 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors duration-300",
            sent
              ? "bg-success-soft text-success-strong"
              : "bg-primary text-primary-foreground",
          )}
        >
          {sent ? (
            <>
              <Check className="size-3.5" aria-hidden />
              ส่งถึงครัวแล้ว
            </>
          ) : (
            "สั่งอาหาร"
          )}
        </div>
      </div>
    </div>
  );
}
