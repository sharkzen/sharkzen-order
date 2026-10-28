import type { Metadata } from "next";
import { ReportsWorkspace } from "@/features/reports/components/reports-workspace";

export const metadata: Metadata = { title: "รายงานยอดขาย" };

export default function ReportsPage() {
  return <ReportsWorkspace />;
}
