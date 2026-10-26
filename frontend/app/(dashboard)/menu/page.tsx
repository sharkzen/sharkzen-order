import type { Metadata } from "next";
import { MenuWorkspace } from "@/features/menu-management/components/menu-workspace";
import { MENUS } from "@/features/menu-management/data/menus";

export const metadata: Metadata = { title: "จัดการเมนูอาหาร" };

export default function MenuPage() {
  return <MenuWorkspace initialMenus={MENUS} />;
}
