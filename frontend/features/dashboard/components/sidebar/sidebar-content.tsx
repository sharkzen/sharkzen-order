import { AccountStatus } from "./account-status";
import { ShopSwitcher } from "./shop-switcher";
import { SidebarBrand } from "./sidebar-brand";
import { SidebarNav } from "./sidebar-nav";

/** เนื้อหาแถบนำทาง ใช้ทั้งแถบถาวรบนจอใหญ่และ drawer บนมือถือ */
export function SidebarContent() {
  return (
    <div className="flex min-h-full flex-col gap-7 px-4 py-6">
      <SidebarBrand />
      <ShopSwitcher />
      <SidebarNav />
      <div className="mt-auto flex flex-col gap-6">
        <AccountStatus />
      </div>
    </div>
  );
}
