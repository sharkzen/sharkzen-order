import type { Metadata } from "next";
import { StaffWorkspace } from "@/features/staff-management/components/staff-workspace";
import { ROLES, STAFF } from "@/features/staff-management/data/staff";

export const metadata: Metadata = { title: "พนักงานและสิทธิ์" };

export default function StaffPage() {
  return <StaffWorkspace initialStaff={STAFF} initialRoles={ROLES} />;
}
