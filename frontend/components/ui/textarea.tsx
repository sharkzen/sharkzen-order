import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { fieldBase } from "./input";

export interface TextareaProps extends ComponentProps<"textarea"> {
  invalid?: boolean;
}

export function Textarea({
  invalid,
  className,
  rows = 4,
  ...props
}: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        fieldBase,
        "py-2",
        invalid ? "border-danger" : "border-border",
        className,
      )}
      {...props}
    />
  );
}
