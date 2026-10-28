import { PiMinusBold, PiPlusBold } from "react-icons/pi";
import { cn } from "@/lib/cn";

interface QuantityStepperProps {
  quantity: number;
  name: string;
  onChange: (quantity: number) => void;
  /** full = แถบเต็มความกว้าง, compact = ปุ่มเล็กในตะกร้า, mini = แคปซูลเล็กบนการ์ดเมนู */
  variant?: "full" | "compact" | "mini" | "pill";
  className?: string;
}

const btn =
  "text-primary-strong hover:bg-primary-muted focus-visible:ring-primary/50 flex cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40";
/** ปุ่มเพิ่ม-ลดจำนวน (ลดจนเหลือ 0 = เอาออกจากตะกร้า) */
export function QuantityStepper({
  quantity,
  name,
  onChange,
  variant = "full",
  className,
}: QuantityStepperProps) {
  const mini = variant === "mini";
  const pill = variant === "pill";
  const size = mini ? "size-9 rounded-full" : pill ? "size-7 rounded-full" : "size-11";
  return (
    <div
      role="group"
      aria-label={`จำนวน ${name}`}
      className={cn(
        "bg-primary-soft flex items-center justify-between rounded-lg px-2",
        mini ? "h-10 w-auto gap-0.5 rounded-full px-0.5" : pill ? "h-9 w-auto gap-1 rounded-full px-1" : "h-11",
        variant === "compact" && "w-auto gap-1 px-1",
        className,
      )}
    >
      <button
        type="button"
        className={cn(btn, size, pill && "bg-surface hover:bg-surface/80")}
        aria-label={`ลด ${name}`} onClick={() => onChange(quantity - 1)}
      >
        <PiMinusBold className={pill ? "size-4" : "size-[18px]"} aria-hidden />
      </button>
      <span className={cn("text-primary-strong min-w-6 text-center text-base font-semibold tabular-nums", pill && "min-w-4 text-sm")} aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        className={cn(btn, size, pill && "bg-primary text-primary-foreground hover:bg-primary-strong")}
        aria-label={`เพิ่ม ${name}`}
        disabled={quantity >= 99}
        onClick={() => onChange(quantity + 1)}
      >
        <PiPlusBold className={pill ? "size-4" : "size-[18px]"} aria-hidden />
      </button>
    </div>
  );
}
