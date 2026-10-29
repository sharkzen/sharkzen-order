import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AdminShell } from "@/features/admin/components/admin-shell";

export const metadata: Metadata = {
  title: { default: "ผู้ดูแลระบบ", template: "%s | ผู้ดูแลระบบ" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
