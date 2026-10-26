import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const tones = {
  default: "bg-surface",
  muted: "bg-background",
  soft: "bg-primary-soft",
} as const;

interface SectionProps extends ComponentProps<"section"> {
  tone?: keyof typeof tones;
  /** className ของกล่องเนื้อหาด้านใน (กว้างสุด 1248px ตามดีไซน์) */
  innerClassName?: string;
}

export function Section({
  tone = "default",
  className,
  innerClassName,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        "flex min-h-[calc(100vh-88px)] scroll-mt-[88px] items-center px-5 py-16 md:px-12 lg:px-24 lg:py-20",
        tones[tone],
        className,
      )}
      {...props}
    >
      <div className={cn("mx-auto w-full max-w-[1248px]", innerClassName)}>
        {children}
      </div>
    </section>
  );
}
