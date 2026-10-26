import { AdminShell } from "@/features/dashboard/components/admin-shell";

export default function DashboardLayout({ children }: LayoutProps<"/">) {
  return <AdminShell>{children}</AdminShell>;
}
