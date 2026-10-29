import { clientHttp } from "@/lib/http/client";
import type { PermissionKey, Role, StaffMember } from "@/features/staff-management/types";

/** รหัสบทบาทเจ้าของร้าน (บัญชีเจ้าของไม่ได้เก็บเป็นพนักงานใน DB) */
export const OWNER_ROLE_ID = "owner";

interface ApiStaff extends Omit<StaffMember, "lastActive"> {
  lastActiveAt: string | null;
}

const FORMAT: Intl.DateTimeFormatOptions = {
  timeZone: "Asia/Bangkok",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
};

export function describeLastActive(iso: string | null, isOwner: boolean) {
  if (isOwner) return "ใช้งานอยู่ตอนนี้";
  if (!iso) return "ยังไม่เคยเข้าสู่ระบบ";
  return `${new Date(iso).toLocaleString("th-TH", FORMAT)} น.`;
}

const toMember = ({ lastActiveAt, ...member }: ApiStaff): StaffMember => ({
  ...member,
  lastActive: describeLastActive(lastActiveAt, member.id === OWNER_ROLE_ID),
});

export interface StaffData {
  roles: Role[];
  staff: StaffMember[];
  /** รหัสร้านที่พนักงานใช้กรอกตอนเข้าสู่ระบบ */
  shopCode: string;
}

export const staffApi = {
  overview: (signal?: AbortSignal) =>
    clientHttp
      .get<{ roles: Role[]; staff: ApiStaff[]; shopCode: string }>("/staff", { signal })
      .then(({ data }) => ({ roles: data.roles, staff: data.staff.map(toMember), shopCode: data.shopCode })),

  /** ตรวจชื่อผู้ใช้กับฐานข้อมูล (ซ้ำในร้านเดียวกันไหม) ถ้าซ้ำจะได้ชื่อที่เสนอให้ใช้แทน */
  checkUsername: (username: string, exceptId?: string, signal?: AbortSignal) =>
    clientHttp
      .get<{ available: boolean; reason?: "invalid" | "taken"; suggestions: string[] }>("/staff/username-available", {
        params: { username, exceptId },
        signal,
      })
      .then((res) => res.data),

  createMember: (input: { name: string; username: string; roleId: string; password: string }) =>
    clientHttp.post<ApiStaff>("/staff/members", input).then((res) => toMember(res.data)),
  updateMember: (id: string, patch: { name?: string; roleId?: string; suspended?: boolean }) =>
    clientHttp.patch<ApiStaff>(`/staff/members/${id}`, patch).then((res) => toMember(res.data)),
  resetPassword: (id: string, password: string) =>
    clientHttp.post(`/staff/members/${id}/reset-password`, { password }),
  deleteMember: (id: string) => clientHttp.delete(`/staff/members/${id}`),

  createRole: (input: { name: string; description: string; permissions: PermissionKey[] }) =>
    clientHttp.post<Role>("/staff/roles", input).then((res) => res.data),
  updateRole: (id: string, input: { name: string; description: string; permissions: PermissionKey[] }) =>
    clientHttp.put<Role>(`/staff/roles/${id}`, input).then((res) => res.data),
  deleteRole: (id: string) => clientHttp.delete(`/staff/roles/${id}`),
};
