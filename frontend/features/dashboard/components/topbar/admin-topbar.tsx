import type { ReactNode } from "react";
import { MobileSidebar } from "./mobile-sidebar";
import { NotificationMenu } from "./notification-menu";
import { ShopStatusToggle } from "./shop-status-toggle";
import { TopbarBreadcrumb } from "./topbar-breadcrumb";
import { UserMenu } from "./user-menu";

/** แถบบนของพื้นที่จัดการร้าน: เส้นทางหน้า เปิด-ปิดร้าน การแจ้งเตือน และบัญชีผู้ใช้ */
export function AdminTopbar({ sidebar }: { sidebar: ReactNode }) {
  return (
    <header className="border-border bg-surface/90 sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b px-4 backdrop-blur sm:px-6 lg:h-20 lg:px-8 2xl:px-10">
      <div className="flex items-center gap-3">
        <MobileSidebar>{sidebar}</MobileSidebar>
        <TopbarBreadcrumb />
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <ShopStatusToggle />
        <NotificationMenu />
        <UserMenu />
      </div>
    </header>
  );
}
