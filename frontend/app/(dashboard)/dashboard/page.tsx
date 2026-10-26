import type { Metadata } from "next";
import { OverviewPage } from "@/features/dashboard/components/overview/overview-page";

export const metadata: Metadata = { title: "ภาพรวมร้านอาหาร" };

export default function DashboardPage() {
  return <OverviewPage />;
}
