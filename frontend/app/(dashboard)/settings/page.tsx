import type { Metadata } from "next";
import { SettingsContainer } from "@/features/shop-settings/components/settings-container";

export const metadata: Metadata = { title: "ตั้งค่าร้าน" };

export default function SettingsPage() {
  return <SettingsContainer />;
}
