import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface CheckboxProps extends Omit<ComponentProps<"input">, "type"> {
  label: ReactNode;
}

export function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <label className="inline-flex cursor-pointer items-start gap-2.5 text-sm">
      <input
        type="checkbox"
        className={cn(
          "border-border accent-primary mt-0.5 size-4 shrink-0 cursor-pointer rounded",
          className,
        )}
        {...props}
      />
      {label}
    </label>
  );
}
