import type { ReactNode } from "react";
import { ShopProvider } from "@/features/shop/components/shop-provider";
import { PermissionGate } from "@/features/auth/components/permission-gate";
import { StaffCallListener } from "@/features/staff-call/components/staff-call-listener";
import { SidebarContent } from "./sidebar/sidebar-content";
import { AdminTopbar } from "./topbar/admin-topbar";

/** โครงพื้นที่จัดการร้าน: แถบนำทางซ้าย (จอใหญ่) + แถบบน + เนื้อหา ทุกส่วนใช้ข้อมูลร้านชุดเดียวกันจาก ShopProvider */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <ShopProvider>
      <StaffCallListener />
      <div className="bg-background flex flex-1">
        <aside className="border-border bg-surface scroll-thin sticky top-0 hidden h-screen w-[232px] shrink-0 overflow-y-auto border-r lg:block">
          <SidebarContent />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar sidebar={<SidebarContent />} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 2xl:p-10"><PermissionGate>{children}</PermissionGate></main>
        </div>
      </div>
    </ShopProvider>
  );
}
