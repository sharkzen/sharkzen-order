"use client";

import { useMemo } from "react";
import { Button, Card, Skeleton } from "@/components/ui";
import { useResource } from "@/hooks/use-resource";
import { SocketEvent } from "@/lib/socket";
import { notify } from "@/lib/toast";
import { staffApi, OWNER_ROLE_ID, type StaffData } from "@/features/staff-management/lib/staff-api";
import type { Role, StaffMember } from "@/features/staff-management/types";
import { StaffView, type StaffActions } from "./staff-view";

const PLACEHOLDER_ROLES: Role[] = [
  { id: OWNER_ROLE_ID, name: "เจ้าของร้าน", description: "คำอธิบายบทบาทตัวอย่าง", builtin: true, locked: true, permissions: [] },
  { id: "r1", name: "บทบาทตัวอย่าง", description: "คำอธิบายบทบาทตัวอย่าง", builtin: true, locked: false, permissions: [] },
];

const PLACEHOLDER_STAFF: StaffMember[] = Array.from({ length: 5 }, (_, index) => ({
  id: `s${index}`,
  name: "ชื่อพนักงานตัวอย่าง",
  username: "username",
  mustChangePassword: false,
  roleId: index === 0 ? OWNER_ROLE_ID : "r1",
  status: "active",
  lastActive: "วันนี้ 00:00 น.",
}));

const NOOP_ACTIONS: StaffActions = {
  createMember: async () => false,
  updateMember: async () => false,
  setSuspended: async () => undefined,
  removeMember: async () => undefined,
  resetPassword: async () => false,
  createRole: async () => undefined,
  saveRole: async () => false,
  deleteRole: async () => false,
};

const TIME_FORMAT: Intl.DateTimeFormatOptions = { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit" };

/** หน้าพนักงานและสิทธิ์: ทุกการแก้ไขบันทึกที่ server และอัปเดตสดทุกแท็บของร้าน */
export function StaffWorkspace() {
  const { data, setData, error, reload } = useResource(staffApi.overview, {
    refetchOn: [SocketEvent.StaffChanged],
  });

  const actions = useMemo<StaffActions>(() => {
    const update = (fn: (current: StaffData) => StaffData) =>
      setData((current) => (current ? fn(current) : current));
    const replaceMember = (next: StaffMember) =>
      update((current) => ({
        ...current,
        staff: current.staff.map((member) => (member.id === next.id ? next : member)),
      }));

    return {
      async createMember(values) {
        try {
          const member = await staffApi.createMember({
            name: values.name,
            username: values.username,
            roleId: values.roleId,
            password: values.password ?? "",
          });
          update((current) => ({ ...current, staff: [...current.staff, member] }));
          notify.success(
            `สร้างบัญชีของ ${member.name} แล้ว`,
            `แจ้งชื่อผู้ใช้ @${member.username} และรหัสผ่านให้พนักงานโดยตรง`,
          );
          return true;
        } catch (e) {
          notify.error(e);
          return false;
        }
      },

      async updateMember(id, values) {
        try {
          replaceMember(await staffApi.updateMember(id, { name: values.name, roleId: values.roleId }));
          notify.success(`บันทึกข้อมูล ${values.name} แล้ว`);
          return true;
        } catch (e) {
          notify.error(e);
          return false;
        }
      },

      async setSuspended(member, suspended) {
        try {
          replaceMember(await staffApi.updateMember(member.id, { suspended }));
          notify.success(
            suspended ? `ระงับ ${member.name} แล้ว` : `เปิดใช้งาน ${member.name} อีกครั้งแล้ว`,
            suspended ? "เข้าสู่ระบบไม่ได้จนกว่าจะเปิดใช้งานอีกครั้ง" : undefined,
          );
        } catch (e) {
          notify.error(e);
        }
      },

      async removeMember(member) {
        try {
          await staffApi.deleteMember(member.id);
          update((current) => ({ ...current, staff: current.staff.filter((item) => item.id !== member.id) }));
          notify.success(`ลบ ${member.name} ออกจากทีมแล้ว`);
        } catch (e) {
          notify.error(e);
        }
      },

      async resetPassword(member, password) {
        try {
          await staffApi.resetPassword(member.id, password);
          replaceMember({ ...member, mustChangePassword: true });
          notify.success(
            `รีเซ็ตรหัสผ่านของ ${member.name} แล้ว`,
            "แจ้งรหัสผ่านใหม่ให้พนักงานโดยตรง พนักงานต้องเปลี่ยนรหัสเองเมื่อเข้าสู่ระบบ",
          );
          return true;
        } catch (e) {
          notify.error(e);
          return false;
        }
      },

      async createRole(values) {
        try {
          const role = await staffApi.createRole(values);
          update((current) => ({ ...current, roles: [...current.roles, role] }));
          notify.success(`สร้างบทบาท ${role.name} แล้ว`, "เลือกสิทธิ์ในตารางด้านขวา");
          return role;
        } catch (e) {
          notify.error(e);
          return undefined;
        }
      },

      async saveRole(role, permissions) {
        try {
          const saved = await staffApi.updateRole(role.id, {
            name: role.name,
            description: role.description,
            permissions,
          });
          update((current) => ({
            ...current,
            roles: current.roles.map((item) => (item.id === role.id ? saved : item)),
          }));
          notify.success(`บันทึกสิทธิ์ของ ${role.name} แล้ว`, "มีผลกับพนักงานในบทบาทนี้ทันที");
          return true;
        } catch (e) {
          notify.error(e);
          return false;
        }
      },

      async deleteRole(role) {
        try {
          await staffApi.deleteRole(role.id);
          update((current) => ({ ...current, roles: current.roles.filter((item) => item.id !== role.id) }));
          notify.success(`ลบบทบาท ${role.name} แล้ว`);
          return true;
        } catch (e) {
          notify.error(e);
          return false;
        }
      },
    };
  }, [setData]);

  if (!data) {
    if (error) {
      return (
        <Card role="alert" className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-danger text-sm">โหลดข้อมูลพนักงานไม่สำเร็จ: {error}</p>
          <Button variant="outline" onClick={reload}>
            ลองใหม่
          </Button>
        </Card>
      );
    }
    return (
      <Skeleton>
        <StaffView staff={PLACEHOLDER_STAFF} roles={PLACEHOLDER_ROLES} updatedAt="00:00 น." actions={NOOP_ACTIONS} />
      </Skeleton>
    );
  }

  return (
    <StaffView
      staff={data.staff}
      roles={data.roles}
      updatedAt={`${new Date().toLocaleTimeString("th-TH", TIME_FORMAT)} น.`}
      actions={actions}
    />
  );
}
