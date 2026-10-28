import type { ComponentProps, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CheckboxProps extends Omit<ComponentProps<"input">, "type"> {
  label: ReactNode;
}

export function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <label className="group inline-flex cursor-pointer items-start gap-2.5 text-sm select-none">
      <span className="relative mt-0.5 flex size-[18px] shrink-0">
        <input
          type="checkbox"
          className={cn(
            "peer border-border bg-surface checked:border-primary checked:bg-primary hover:border-primary focus-visible:ring-primary/30 aria-[invalid=true]:border-danger size-full cursor-pointer appearance-none rounded-[5px] border-[1.5px] transition-colors focus-visible:ring-4 focus-visible:outline-none",
            className,
          )}
          {...props}
        />
        <Check
          aria-hidden
          strokeWidth={3}
          className="pointer-events-none absolute inset-0 m-auto size-3 scale-50 text-white opacity-0 transition peer-checked:scale-100 peer-checked:opacity-100"
        />
      </span>
      {label}
    </label>
  );
}
