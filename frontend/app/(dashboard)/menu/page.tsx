import type { Metadata } from "next";
import { MenuWorkspace } from "@/features/menu-management/components/menu-workspace";

export const metadata: Metadata = { title: "จัดการเมนูอาหาร" };

export default function MenuPage() {
  return <MenuWorkspace />;
}
