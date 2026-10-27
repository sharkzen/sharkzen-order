import type { Metadata } from "next";
import { PlanOnboarding } from "@/features/auth/components/plan-onboarding";
import { findPlan, parseBilling } from "@/features/landing/data";

export const metadata: Metadata = {
  title: "เลือกแพ็กเกจ",
  robots: { index: false },
};

export default async function OnboardingPlanPage(
  props: PageProps<"/onboarding/plan">,
) {
  const { plan, billing } = await props.searchParams;
  const str = (value: string | string[] | undefined) =>
    typeof value === "string" ? value : undefined;

  return (
    <PlanOnboarding
      initialPlan={findPlan(str(plan))?.id}
      initialBilling={str(billing) ? parseBilling(str(billing)) : undefined}
    />
  );
}
