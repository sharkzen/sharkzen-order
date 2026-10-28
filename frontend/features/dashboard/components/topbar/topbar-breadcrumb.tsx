"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { SIDEBAR_NAV } from "@/features/dashboard/data/navigation";

/** เส้นทางหน้า: "จัดการร้าน > ชื่อหน้าปัจจุบัน" หาชื่อหน้าจากเมนูนำทาง */
export function TopbarBreadcrumb() {
  const pathname = usePathname();
  const current = SIDEBAR_NAV.find(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );

  return (
    <nav
      aria-label="เส้นทางหน้า"
      className="flex items-center gap-2.5 text-[13px]"
    >
      <span className="text-muted-foreground hidden sm:inline">จัดการร้าน</span>
      <ChevronRight
        className="text-muted-foreground hidden size-3.5 sm:block"
        aria-hidden
      />
      <span className="text-foreground font-semibold">
        {current?.pageTitle ?? current?.label ?? "ภาพรวมร้านอาหาร"}
      </span>
    </nav>
  );
}
