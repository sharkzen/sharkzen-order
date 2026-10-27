import type { Metadata } from "next";
import { ReportsWorkspace } from "@/features/reports/components/reports-workspace";
import { DAILY_SALES } from "@/features/reports/data/reports";

export const metadata: Metadata = { title: "รายงานยอดขาย" };

export default function ReportsPage() {
  return <ReportsWorkspace days={DAILY_SALES} />;
}
