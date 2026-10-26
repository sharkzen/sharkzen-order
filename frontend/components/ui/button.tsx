import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-strong",
  secondary: "bg-primary-soft text-primary-strong hover:bg-primary-muted",
  outline: "border border-border bg-surface text-foreground hover:bg-muted",
  ghost: "bg-transparent hover:bg-muted",
  danger: "bg-danger text-white hover:bg-danger-strong",
} as const;

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-[46px] px-[18px] text-sm",
  lg: "h-12 px-6 text-base",
} as const;

interface ButtonStyleOptions {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
}

/** ใช้กับ <Link> หรือ <a> ที่ต้องการหน้าตาเป็นปุ่ม: className={buttonVariants({ variant: "outline" })} */
export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: ButtonStyleOptions = {}) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-colors",
    "focus-visible:ring-primary/50 focus-visible:ring-2 focus-visible:outline-none",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps
  extends ComponentProps<"button">, Omit<ButtonStyleOptions, "className"> {
  loading?: boolean;
}

export function Button({
  variant,
  size,
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={buttonVariants({ variant, size, className })}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}
