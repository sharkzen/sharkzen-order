import type { Metadata } from "next";
import { StaffLoginForm } from "@/features/auth/components/staff-login-form";

export const metadata: Metadata = { title: "เข้าสู่ระบบพนักงาน" };

export default function StaffLoginPage() {
  return <StaffLoginForm />;
}
