import type { Metadata } from "next";
import { SettingsWorkspace } from "@/features/shop-settings/components/settings-workspace";
import { SHOP_SETTINGS } from "@/features/shop-settings/data/settings";

export const metadata: Metadata = { title: "ตั้งค่าร้าน" };

export default function SettingsPage() {
  return <SettingsWorkspace initialSettings={SHOP_SETTINGS} />;
}
