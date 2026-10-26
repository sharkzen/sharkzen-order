import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

// หน้าเป็น Server Component — เฉพาะ form ที่ต้องโต้ตอบเท่านั้นที่เป็น Client Component
export default function LoginPage() {
  return <LoginForm />;
}
