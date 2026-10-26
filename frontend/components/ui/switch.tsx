import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

interface SwitchProps extends Omit<ComponentProps<"button">, "onChange"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/** สวิตช์เปิด/ปิด (ต้องใส่ aria-label ที่บอกว่าสวิตช์นี้ควบคุมอะไร) */
export function Switch({
  checked,
  onCheckedChange,
  className,
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "focus-visible:ring-primary/50 relative h-6 w-10 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-success" : "bg-slate-300",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-[3px] left-[3px] size-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 motion-reduce:transition-none",
          checked && "translate-x-4",
        )}
      />
    </button>
  );
}
