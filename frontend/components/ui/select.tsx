import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { fieldBase } from "./input";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends ComponentProps<"select"> {
  options: SelectOption[];
  placeholder?: string;
  invalid?: boolean;
}

export function Select({
  options,
  placeholder,
  invalid,
  className,
  ...props
}: SelectProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(
        fieldBase,
        "h-10",
        invalid ? "border-danger" : "border-border",
        className,
      )}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
