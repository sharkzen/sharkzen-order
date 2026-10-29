"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MobileSidebar } from "@/features/dashboard/components/topbar/mobile-sidebar";
import { ADMIN_NAV, isActiveNav } from "./admin-nav";

/** แถบบนของพื้นที่ผู้ดูแลระบบ: เมนูมือถือ และชื่อหน้าที่กำลังดู */
export function AdminTopbar({ sidebar }: { sidebar: ReactNode }) {
  const pathname = usePathname();
  const current = ADMIN_NAV.find((item) => isActiveNav(pathname, item.href));

  return (
    <header className="border-border bg-surface/90 sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur sm:px-6 lg:h-20 lg:px-8 2xl:px-10">
      <MobileSidebar label="เมนูผู้ดูแลระบบ">{sidebar}</MobileSidebar>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground hidden sm:inline">ผู้ดูแลระบบ</span>
        <span aria-hidden className="text-muted-foreground hidden sm:inline">
          /
        </span>
        <span className="text-foreground font-semibold">{current?.title ?? "ผู้ดูแลระบบ"}</span>
      </div>
    </header>
  );
}
