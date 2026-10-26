"use client";

import Link from "next/link";
import { useActiveSection } from "@/hooks/use-active-section";
import type { NavItem } from "@/features/landing/data";
import { cn } from "@/lib/cn";

/** เมนูหลักบนจอใหญ่ ไฮไลต์ตามหัวข้อที่กำลังเลื่อนดูอยู่ */
export function SiteNav({ items }: { items: NavItem[] }) {
  const active = useActiveSection(items.map((item) => item.id));

  return (
    <nav
      aria-label="เมนูหลัก"
      className="hidden items-center gap-7 text-sm lg:flex"
    >
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          aria-current={item.id === active ? "location" : undefined}
          className={cn(
            "hover:text-primary-strong transition-colors",
            item.id === active
              ? "text-primary-strong font-semibold"
              : "text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
