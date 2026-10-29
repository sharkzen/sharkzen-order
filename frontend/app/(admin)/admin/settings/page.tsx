import type { Metadata } from "next";
import { SettingsPage } from "@/features/admin/components/settings-page";

export const metadata: Metadata = { title: "ตั้งค่าและบันทึก" };

export default function AdminSettingsPage() {
  return <SettingsPage />;
}
