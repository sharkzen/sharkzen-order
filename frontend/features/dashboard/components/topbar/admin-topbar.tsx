import type { ReactNode } from "react";
import { Bell, CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui";
import { ACCOUNT, SHOP } from "../../data/overview";
import { MobileSidebar } from "./mobile-sidebar";
import { TopbarBreadcrumb } from "./topbar-breadcrumb";
import { UserMenu } from "./user-menu";

/** แถบบนของพื้นที่จัดการร้าน: เส้นทางหน้า สถานะร้าน การแจ้งเตือน และบัญชีผู้ใช้ */
export function AdminTopbar({ sidebar }: { sidebar: ReactNode }) {
  return (
    <header className="border-border bg-surface/90 sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b px-4 backdrop-blur sm:px-6 lg:h-20 lg:px-8 2xl:px-10">
      <div className="flex items-center gap-3">
        <MobileSidebar>{sidebar}</MobileSidebar>
        <TopbarBreadcrumb />
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        {SHOP.isOpen && (
          <Badge tone="success" className="hidden sm:inline-flex">
            <CircleCheck className="size-[13px]" aria-hidden />
            เปิดรับออร์เดอร์
          </Badge>
        )}
        <button
          type="button"
          aria-label="การแจ้งเตือน"
          className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-primary/50 flex size-9 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <Bell className="size-5" aria-hidden />
        </button>
        <UserMenu account={ACCOUNT} />
      </div>
    </header>
  );
}
