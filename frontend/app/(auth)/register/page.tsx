import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";
import { parseBilling } from "@/features/landing/data";

export const metadata: Metadata = { title: "สมัครสมาชิก" };

export default async function RegisterPage(props: PageProps<"/register">) {
  const { plan, billing } = await props.searchParams;
  const str = (value: string | string[] | undefined) =>
    typeof value === "string" ? value : undefined;

  return (
    <RegisterForm
      plan={str(plan)}
      billing={parseBilling(str(billing))}
    />
  );
}
