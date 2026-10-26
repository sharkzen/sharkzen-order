"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { SIDEBAR_NAV } from "../../data/navigation";

/**
 * รายการเมนูหลัก ไฮไลต์หน้าปัจจุบันตาม URL (client เพราะต้องอ่าน pathname)
 * อ่านข้อมูลเมนูเองแทนการรับ props เพราะไอคอนเป็นฟังก์ชัน ส่งจาก Server Component ไม่ได้
 */
export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="การจัดการร้าน" className="flex flex-col gap-1.5">
      <p className="text-muted-foreground text-[11px]">การจัดการร้าน</p>
      {SIDEBAR_NAV.map(({ label, href, icon: Icon, count }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-visible:ring-primary/50 flex h-[46px] items-center gap-[11px] rounded-lg px-3 text-[13px] transition-colors focus-visible:ring-2 focus-visible:outline-none",
              active
                ? "bg-primary-soft text-primary-strong font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-[19px] shrink-0" aria-hidden />
            <span className="flex-1">{label}</span>
            {count !== undefined && (
              <span className="bg-primary text-primary-foreground rounded-md px-1.5 py-px text-[10px] font-semibold">
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
