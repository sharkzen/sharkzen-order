import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const tones = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success-soft text-success-strong",
  warning: "bg-warning-soft text-warning-strong",
  danger: "bg-danger-soft text-danger-strong",
  info: "bg-primary-soft text-primary-strong",
} as const;

export interface BadgeProps extends ComponentProps<"span"> {
  tone?: keyof typeof tones;
}

/** ป้ายสถานะทรงแคปซูล ใส่ไอคอน (lucide) เป็น child ตัวแรกได้ */
export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[5px] rounded-full px-[9px] py-1 text-[13px] font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
