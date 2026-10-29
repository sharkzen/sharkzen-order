import type { Metadata } from "next";
import { PlansPage } from "@/features/admin/components/plans-page";

export const metadata: Metadata = { title: "แพ็กเกจและราคา" };

export default function AdminPlansPage() {
  return <PlansPage />;
}
