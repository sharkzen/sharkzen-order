import type { Metadata } from "next";
import { StaffPasswordForm } from "@/features/auth/components/staff-password-form";

export const metadata: Metadata = { title: "ตั้งรหัสผ่านใหม่", robots: { index: false } };

export default function StaffPasswordPage() {
  return <StaffPasswordForm />;
}
