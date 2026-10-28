"use client";

import { useMemo, useState } from "react";
import { Info, Search, SearchX } from "lucide-react";
import { Badge, Card, ConfirmDialog, EmptyState, Input } from "@/components/ui";
import { notify } from "@/lib/toast";
import { OWNER_ROLE_ID, UPDATED_AT } from "../data/staff";
import { sameSet } from "../lib/permission-utils";
import type { PermissionKey, Role, StaffMember } from "../types";
import { MemberDialog, type MemberValues } from "./member-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { RoleDialog } from "./role-dialog";
import { RolesPanel } from "./roles-panel";
import { StaffList } from "./staff-list";
import { StaffPageHeader } from "./staff-page-header";
import { StaffTabs, type StaffTab } from "./staff-tabs";

interface StaffWorkspaceProps {
  initialStaff: StaffMember[];
  initialRoles: Role[];
  /** สร้างบัญชีพนักงานได้ (staff.create ปกติมีเฉพาะเจ้าของร้าน) */
  canCreate?: boolean;
  /** แก้ไข ระงับ และลบพนักงานได้ (staff.manage) */
  canManage?: boolean;
  /** รีเซ็ตรหัสผ่านพนักงานที่ลืมได้ (staff.reset_password เจ้าของร้านและผู้จัดการ) */
  canResetPassword?: boolean;
  /** แก้บทบาทและสิทธิ์ได้ (สิทธิ์ staff.roles ของผู้ใช้ปัจจุบัน) */
  canEditRoles?: boolean;
}

/**
 * พื้นที่ทำงานของหน้าพนักงาน (client เพราะมีฟอร์ม ตารางสิทธิ์ และการยืนยัน)
 * สถานะเก็บในหน้านี้ก่อน เมื่อมี API ให้เรียกบันทึกที่ handler แต่ละตัว
 * สิทธิ์ที่กำลังแก้เก็บเป็น draft แยกตามบทบาท จนกว่าจะกดบันทึก
 */
export function StaffWorkspace({
  initialStaff,
  initialRoles,
  canCreate = true,
  canManage = true,
  canResetPassword = true,
  canEditRoles = true,
}: StaffWorkspaceProps) {
  const [staff, setStaff] = useState(initialStaff);
  const [roles, setRoles] = useState(initialRoles);
  const [tab, setTab] = useState<StaffTab>("members");
  const [query, setQuery] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState(OWNER_ROLE_ID);
  const [drafts, setDrafts] = useState<Record<string, PermissionKey[]>>({});

  const [memberTarget, setMemberTarget] = useState<StaffMember | "new" | null>(
    null,
  );
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<StaffMember | null>(null);
  const [pendingRemove, setPendingRemove] = useState<StaffMember | null>(null);
  const [pendingDeleteRole, setPendingDeleteRole] = useState<Role | null>(null);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return staff;
    return staff.filter((member) => {
      const roleName =
        roles.find((role) => role.id === member.roleId)?.name ?? "";
      return [member.name, member.username, roleName].some((text) =>
        text.toLowerCase().includes(keyword),
      );
    });
  }, [staff, roles, query]);

  const activeCount = staff.filter(
    (member) => member.status === "active",
  ).length;
  const pendingPasswordCount = staff.filter(
    (member) => member.status === "active" && member.mustChangePassword,
  ).length;

  function submitMember({ password, ...values }: MemberValues) {
    if (memberTarget === "new") {
      // เมื่อมี API ให้ส่ง password ไปสร้างบัญชี (เซิร์ฟเวอร์เก็บแบบแฮชเท่านั้น) ห้ามเก็บรหัสผ่านไว้ฝั่งหน้าเว็บ
      void password;
      setStaff((prev) => [
        ...prev,
        {
          id: `s-${Date.now()}`,
          ...values,
          status: "active",
          mustChangePassword: true,
          lastActive: "ยังไม่เคยเข้าสู่ระบบ",
        },
      ]);
      notify.success(
        `สร้างบัญชีของ ${values.name} แล้ว`,
        `แจ้งชื่อผู้ใช้ @${values.username} และรหัสผ่านให้พนักงานโดยตรง`,
      );
    } else if (memberTarget) {
      const id = memberTarget.id;
      setStaff((prev) =>
        prev.map((member) =>
          member.id === id ? { ...member, ...values } : member,
        ),
      );
      notify.success(`บันทึกข้อมูล ${values.name} แล้ว`);
    }
    setMemberTarget(null);
  }

  function resetPassword(member: StaffMember, password: string) {
    // เมื่อมี API ให้ส่ง password ไปรีเซ็ตที่เซิร์ฟเวอร์ ห้ามเก็บรหัสผ่านไว้ฝั่งหน้าเว็บ
    void password;
    setStaff((prev) =>
      prev.map((item) =>
        item.id === member.id ? { ...item, mustChangePassword: true } : item,
      ),
    );
    setResetTarget(null);
    notify.success(
      `รีเซ็ตรหัสผ่านของ ${member.name} แล้ว`,
      "แจ้งรหัสผ่านใหม่ให้พนักงานโดยตรง พนักงานต้องเปลี่ยนรหัสเองเมื่อเข้าสู่ระบบ",
    );
  }

  function toggleSuspend(member: StaffMember) {
    const suspend = member.status !== "suspended";
    setStaff((prev) =>
      prev.map((item) =>
        item.id === member.id
          ? { ...item, status: suspend ? "suspended" : "active" }
          : item,
      ),
    );
    notify.success(
      suspend
        ? `ระงับ ${member.name} แล้ว`
        : `เปิดใช้งาน ${member.name} อีกครั้งแล้ว`,
      suspend ? "เข้าสู่ระบบไม่ได้จนกว่าจะเปิดใช้งานอีกครั้ง" : undefined,
    );
  }

  function confirmRemove() {
    if (!pendingRemove) return;
    setStaff((prev) => prev.filter((member) => member.id !== pendingRemove.id));
    notify.success(`ลบ ${pendingRemove.name} ออกจากทีมแล้ว`);
    setPendingRemove(null);
  }

  function changeDraft(roleId: string, permissions: PermissionKey[]) {
    const saved = roles.find((role) => role.id === roleId)?.permissions ?? [];
    setDrafts((prev) => {
      const next = { ...prev };
      if (sameSet(permissions, saved)) delete next[roleId];
      else next[roleId] = permissions;
      return next;
    });
  }

  function discardDraft(roleId: string) {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[roleId];
      return next;
    });
  }

  function saveRole(roleId: string) {
    const permissions = drafts[roleId];
    if (!permissions) return;
    const role = roles.find((item) => item.id === roleId);
    setRoles((prev) =>
      prev.map((item) =>
        item.id === roleId ? { ...item, permissions } : item,
      ),
    );
    discardDraft(roleId);
    const count = staff.filter((member) => member.roleId === roleId).length;
    notify.success(
      `บันทึกสิทธิ์ของ ${role?.name} แล้ว`,
      `มีผลกับ ${count} คนทันที`,
    );
  }

  function createRole(values: {
    name: string;
    description: string;
    copyFrom: string;
  }) {
    const source = roles.find((role) => role.id === values.copyFrom);
    const role: Role = {
      id: `role-${Date.now()}`,
      name: values.name,
      description: values.description,
      builtin: false,
      locked: false,
      permissions: source ? [...source.permissions] : [],
    };
    setRoles((prev) => [...prev, role]);
    setSelectedRoleId(role.id);
    setRoleDialogOpen(false);
    notify.success(`สร้างบทบาท ${role.name} แล้ว`, "เลือกสิทธิ์ในตารางด้านขวา");
  }

  function confirmDeleteRole() {
    if (!pendingDeleteRole) return;
    setRoles((prev) => prev.filter((role) => role.id !== pendingDeleteRole.id));
    discardDraft(pendingDeleteRole.id);
    setSelectedRoleId(OWNER_ROLE_ID);
    notify.success(`ลบบทบาท ${pendingDeleteRole.name} แล้ว`);
    setPendingDeleteRole(null);
  }

  return (
    <div className="flex w-full flex-col gap-5 sm:gap-6">
      <StaffPageHeader
        onAdd={canCreate ? () => setMemberTarget("new") : undefined}
      />

      <StaffTabs
        value={tab}
        memberCount={staff.length}
        roleCount={roles.length}
        onChange={setTab}
      />

      {tab === "members" ? (
        <section
          id="staff-panel-members"
          role="tabpanel"
          aria-labelledby="staff-tab-members"
          className="flex flex-col gap-4"
        >
          <Card className="overflow-hidden p-0">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-foreground text-[17px] font-semibold">
                  ทีมงานทั้งหมด
                </h2>
                <Badge tone="success">{activeCount} ใช้งานอยู่</Badge>
                {pendingPasswordCount > 0 && (
                  <Badge tone="warning">
                    {pendingPasswordCount} รอตั้งรหัสผ่านใหม่
                  </Badge>
                )}
              </div>
              <div className="relative w-full sm:w-[280px]">
                <Search
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  aria-hidden
                />
                <Input
                  type="search"
                  aria-label="ค้นหาพนักงาน"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ค้นหาชื่อ ชื่อผู้ใช้ หรือบทบาท"
                  className="pl-9"
                />
              </div>
            </div>

            {filtered.length > 0 ? (
              <StaffList
                members={filtered}
                roles={roles}
                canManage={canManage}
                canResetPassword={canResetPassword}
                onResetPassword={setResetTarget}
                onEdit={setMemberTarget}
                onToggleSuspend={toggleSuspend}
                onRemove={setPendingRemove}
              />
            ) : (
              <EmptyState
                icon={<SearchX className="size-6" aria-hidden />}
                title="ไม่พบพนักงานที่ตรงกับคำค้นหา"
                description="ลองค้นหาด้วยชื่อ ชื่อผู้ใช้ หรือบทบาทอื่น"
                actionLabel="ล้างการค้นหา"
                onAction={() => setQuery("")}
              />
            )}
          </Card>
        </section>
      ) : (
        <section
          id="staff-panel-roles"
          role="tabpanel"
          aria-labelledby="staff-tab-roles"
        >
          <RolesPanel
            roles={roles}
            members={staff}
            selectedId={selectedRoleId}
            drafts={drafts}
            canEdit={canEditRoles}
            onSelect={setSelectedRoleId}
            onChangeDraft={changeDraft}
            onSave={saveRole}
            onDiscard={discardDraft}
            onCreate={() => setRoleDialogOpen(true)}
            onDelete={setPendingDeleteRole}
          />
        </section>
      )}

      <p className="text-muted-foreground flex items-start gap-2 text-xs">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        อัปเดตล่าสุด {UPDATED_AT} • เมื่อเปลี่ยนสิทธิ์ของบทบาท
        พนักงานทุกคนในบทบาทนั้นจะเห็นเมนูและปุ่มตามสิทธิ์ใหม่ทันที
      </p>

      <MemberDialog
        target={memberTarget}
        roles={roles}
        members={staff}
        onClose={() => setMemberTarget(null)}
        onSubmit={submitMember}
      />
      <ResetPasswordDialog
        member={resetTarget}
        onClose={() => setResetTarget(null)}
        onSubmit={resetPassword}
      />
      <RoleDialog
        open={roleDialogOpen}
        roles={roles}
        onClose={() => setRoleDialogOpen(false)}
        onSubmit={createRole}
      />
      <ConfirmDialog
        open={pendingRemove !== null}
        title="ลบพนักงานออกจากทีมหรือไม่?"
        description={
          <>
            <strong>{pendingRemove?.name}</strong> จะเข้าสู่ระบบไม่ได้อีก
            หากต้องการแค่พักการใช้งานชั่วคราว ให้เลือก &quot;ระงับ&quot; แทน
          </>
        }
        confirmLabel="ลบพนักงาน"
        tone="danger"
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
      <ConfirmDialog
        open={pendingDeleteRole !== null}
        title="ลบบทบาทนี้หรือไม่?"
        description={
          <>
            บทบาท <strong>{pendingDeleteRole?.name}</strong>{" "}
            และสิทธิ์ที่ตั้งไว้จะหายไป
          </>
        }
        confirmLabel="ลบบทบาท"
        tone="danger"
        onConfirm={confirmDeleteRole}
        onCancel={() => setPendingDeleteRole(null)}
      />
    </div>
  );
}
