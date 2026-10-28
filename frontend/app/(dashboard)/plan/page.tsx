import type { Metadata } from "next";
import { Suspense } from "react";
import { PlanWorkspace } from "@/features/billing/components/plan-workspace";

export const metadata: Metadata = { title: "แพ็กเกจและการชำระเงิน" };

export default function PlanPage() {
  // PlanWorkspace อ่าน query string (?checkout=…) หลังกลับจากหน้าชำระเงิน จึงต้องอยู่ใน Suspense
  return (
    <Suspense fallback={null}>
      <PlanWorkspace />
    </Suspense>
  );
}
