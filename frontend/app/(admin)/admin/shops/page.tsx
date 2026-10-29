import type { Metadata } from "next";
import { ShopsPage } from "@/features/admin/components/shops-page";

export const metadata: Metadata = { title: "ร้านค้า" };

export default function AdminShopsPage() {
  return <ShopsPage />;
}
