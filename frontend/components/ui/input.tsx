import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export const fieldBase =
  "w-full rounded-lg border bg-surface px-3 text-sm transition-colors placeholder:text-muted-foreground " +
  "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export interface InputProps extends ComponentProps<"input"> {
  invalid?: boolean;
}

export function Input({ invalid, className, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        fieldBase,
        "h-10",
        invalid ? "border-danger" : "border-border",
        className,
      )}
      {...props}
    />
  );
}
