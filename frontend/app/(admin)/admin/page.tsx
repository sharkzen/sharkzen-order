import type { Metadata } from "next";
import { OverviewPage } from "@/features/admin/components/overview-page";

export const metadata: Metadata = { title: "ภาพรวมระบบ" };

export default function AdminOverviewPage() {
  return <OverviewPage />;
}
