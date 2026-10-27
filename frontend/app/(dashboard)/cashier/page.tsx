import type { Metadata } from "next";
import { CashierWorkspace } from "@/features/cashier/components/cashier-workspace";
import { BILLS } from "@/features/cashier/data/bills";
import { SHOP_SETTINGS } from "@/features/shop-settings/data/settings";

export const metadata: Metadata = { title: "คิดเงิน" };

export default function CashierPage() {
  // ค่าการคิดเงินมาจากหน้าตั้งค่าร้าน เมื่อมี API ให้โหลดค่าจริงของร้านแทน SHOP_SETTINGS
  const config = {
    serviceChargePercent: SHOP_SETTINGS.serviceChargePercent,
    vatIncluded: SHOP_SETTINGS.vatIncluded,
    promptPayId: SHOP_SETTINGS.promptPayId,
    shopName: SHOP_SETTINGS.name,
    branch: SHOP_SETTINGS.branch,
    phone: SHOP_SETTINGS.phone,
    address: SHOP_SETTINGS.address,
  };

  return <CashierWorkspace initialBills={BILLS} config={config} />;
}
