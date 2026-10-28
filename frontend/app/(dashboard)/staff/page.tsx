import type { Metadata } from "next";
import { StaffWorkspace } from "@/features/staff-management/components/staff-workspace";

export const metadata: Metadata = { title: "พนักงานและสิทธิ์" };

export default function StaffPage() {
  return <StaffWorkspace />;
}
