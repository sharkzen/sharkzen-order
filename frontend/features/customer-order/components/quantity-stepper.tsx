import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

interface QuantityStepperProps {
  quantity: number;
  name: string;
  onChange: (quantity: number) => void;
  /** full = แถบเต็มความกว้างบนการ์ดเมนู, compact = ปุ่มเล็กในตะกร้า */
  variant?: "full" | "compact";
  className?: string;
}

const btn =
  "text-primary-strong hover:bg-primary-muted focus-visible:ring-primary/50 flex size-11 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40";
/** ปุ่มเพิ่ม-ลดจำนวน (ลดจนเหลือ 0 = เอาออกจากตะกร้า) */
export function QuantityStepper({
  quantity,
  name,
  onChange,
  variant = "full",
  className,
}: QuantityStepperProps) {
  return (
    <div
      role="group"
      aria-label={`จำนวน ${name}`}
      className={cn(
        "bg-primary-soft flex h-11 items-center justify-between rounded-lg px-2",
        variant === "compact" && "w-auto gap-1 px-1",
        className,
      )}
    >
      <button type="button" className={btn} aria-label={`ลด ${name}`} onClick={() => onChange(quantity - 1)}>
        <Minus className="size-[18px]" aria-hidden />
      </button>
      <span className="text-primary-strong min-w-6 text-center text-base font-semibold tabular-nums" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        className={btn}
        aria-label={`เพิ่ม ${name}`}
        disabled={quantity >= 99}
        onClick={() => onChange(quantity + 1)}
      >
        <Plus className="size-[18px]" aria-hidden />
      </button>
    </div>
  );
}
