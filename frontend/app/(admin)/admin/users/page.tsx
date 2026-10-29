import type { Metadata } from "next";
import { UsersPage } from "@/features/admin/components/users-page";

export const metadata: Metadata = { title: "ผู้ใช้งาน" };

export default function AdminUsersPage() {
  return <UsersPage />;
}
