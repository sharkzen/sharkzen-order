"use client";

import { Store } from "lucide-react";
import { useShop } from "@/features/shop/components/shop-provider";
import { ShopSwitcher } from "./shop-switcher";

/** เจ้าของร้านสลับ/เพิ่มสาขาได้ พนักงานผูกกับสาขาเดียวจึงแสดงแค่ชื่อสาขา */
export function ShopSwitcherGate() {
  const { shop, user } = useShop();
  if (user?.role !== "STAFF") return <ShopSwitcher />;
  return (
    <div className="border-border flex items-center gap-3 rounded-xl border p-3">
      <span className="bg-primary-soft text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
        <Store className="size-[18px]" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-foreground truncate text-[13px] font-semibold">{shop?.name ?? " "}</p>
        <p className="text-muted-foreground truncate text-[11px]">{shop?.branch || "สาขาหลัก"}</p>
      </div>
    </div>
  );
}
