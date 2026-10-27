import type { Metadata } from "next";
import { TablesWorkspace } from "@/features/table-management/components/tables-workspace";
import { TABLES } from "@/features/table-management/data/tables";

export const metadata: Metadata = { title: "โต๊ะและคิวอาร์โค้ด" };

export default function TablesPage() {
  return <TablesWorkspace initialTables={TABLES} />;
}
