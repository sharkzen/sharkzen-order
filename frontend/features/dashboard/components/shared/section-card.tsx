import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";

interface SectionCardProps {
  title: string;
  /** ลิงก์มุมขวาของหัวข้อ เช่น "ดูทั้งหมด →" */
  action?: { label: string; href: string };
  className?: string;
  children: ReactNode;
}

/** การ์ดหัวข้อ + เนื้อหา ใช้ซ้ำทุกส่วนของหน้าแดชบอร์ด */
export function SectionCard({
  title,
  action,
  className,
  children,
}: SectionCardProps) {
  return (
    <Card className={cn("flex flex-col gap-5 p-[22px]", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-foreground text-base font-semibold">{title}</h2>
        {action && (
          <Link
            href={action.href}
            className="text-primary-strong focus-visible:ring-primary/50 rounded text-xs font-medium whitespace-nowrap hover:underline focus-visible:ring-2 focus-visible:outline-none"
          >
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </Card>
  );
}
