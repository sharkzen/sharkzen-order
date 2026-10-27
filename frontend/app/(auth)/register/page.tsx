import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";
import { findPlan, parseBilling } from "@/features/landing/data";

export const metadata: Metadata = { title: "สมัครสมาชิก" };

export default async function RegisterPage(props: PageProps<"/register">) {
  const { plan, billing } = await props.searchParams;
  const str = (value: string | string[] | undefined) =>
    typeof value === "string" ? value : undefined;

  return (
    <RegisterForm
      plan={findPlan(str(plan))?.id}
      billing={parseBilling(str(billing))}
    />
  );
}
