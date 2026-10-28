import type { Metadata } from "next";
import { TablesWorkspace } from "@/features/table-management/components/tables-workspace";

export const metadata: Metadata = { title: "โต๊ะและคิวอาร์โค้ด" };

export default function TablesPage() {
  return <TablesWorkspace />;
}
