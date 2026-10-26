import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SectionHeadingProps {
  title: ReactNode;
  description?: string;
  /** ข้อความเล็กเหนือหัวข้อ ใช้เฉพาะเมื่อให้ข้อมูลเพิ่มจริงๆ */
  eyebrow?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  title,
  description,
  eyebrow,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        align === "center" ? "items-center text-center" : "items-start",
        className,
      )}
    >
      {eyebrow && (
        <p className="text-primary-strong text-[13px] font-semibold">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-foreground text-[28px] leading-[1.4] font-semibold md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="text-muted-foreground text-base">{description}</p>
      )}
    </div>
  );
}
