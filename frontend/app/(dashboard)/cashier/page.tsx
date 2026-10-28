import type { Metadata } from "next";
import { CashierWorkspace } from "@/features/cashier/components/cashier-container";

export const metadata: Metadata = { title: "คิดเงิน" };

export default function CashierPage() {
  return <CashierWorkspace />;
}
