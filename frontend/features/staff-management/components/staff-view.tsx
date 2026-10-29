"use client";

import { useMemo, useState } from "react";
import { Info, Search, SearchX } from "lucide-react";
import { Badge, Card, ConfirmDialog, EmptyState, Input } from "@/components/ui";
import { OWNER_ROLE_ID } from "@/features/staff-management/lib/staff-api";
import { sameSet } from "@/features/staff-management/lib/permission-utils";
import type { PermissionKey, Role, StaffMember } from "@/features/staff-management/types";
import { MemberDialog, type MemberValues } from "./member-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { RoleDialog } from "./role-dialog";
import { RolesPanel } from "./roles-panel";
import { StaffList } from "./staff-list";
import { StaffPageHeader } from "./staff-page-header";
import { StaffTabs, type StaffTab } from "./staff-tabs";

export interface StaffActions {
  /** สร้างบัญชี คืน true เมื่อสำเร็จ (ไม่สำเร็จจะแจ้งสาเหตุให้แล้ว) */
  createMember: (values: MemberValues) => Promise<boolean>;
  updateMember: (id: string, values: MemberValues) => Promise<boolean>;
  setSuspended: (member: StaffMember, suspended: boolean) => Promise<void>;
  removeMember: (member: StaffMember) => Promise<void>;
  resetPassword: (member: StaffMember, password: string) => Promise<boolean>;
  createRole: (values: { name: string; description: string; permissions: PermissionKey[] }) => Promise<Role | undefined>;
  saveRole: (role: Role, permissions: PermissionKey[]) => Promise<boolean>;
  deleteRole: (role: Role) => Promise<boolean>;
}

interface StaffViewProps {
  /** รหัสร้านที่พนักงานใช้เข้าสู่ระบบ */
  shopCode: string;
  staff: StaffMember[];
  roles: Role[];
  updatedAt: string;
  actions: StaffActions;
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
 * พื้นที่ทำงานของหน้าพนักงาน (ไม่ดึงข้อมูลเอง รับข้อมูลและ actions จาก StaffWorkspace จึงใช้เรนเดอร์เป็น skeleton ได้)
 * สิทธิ์ที่กำลังแก้เก็บเป็น draft แยกตามบทบาท จนกว่าจะกดบันทึก
 */
export function StaffView({
  staff,
  roles,
  shopCode,
  updatedAt,
  actions,
  canCreate = true,
  canManage = true,
  canResetPassword = true,
  canEditRoles = true,
}: StaffViewProps) {
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

  async function submitMember(values: MemberValues) {
    const ok =
      memberTarget === "new"
        ? await actions.createMember(values)
        : memberTarget
          ? await actions.updateMember(memberTarget.id, values)
          : false;
    if (ok) setMemberTarget(null);
  }

  async function resetPassword(member: StaffMember, password: string) {
    if (await actions.resetPassword(member, password)) setResetTarget(null);
  }

  function toggleSuspend(member: StaffMember) {
    void actions.setSuspended(member, member.status !== "suspended");
  }

  function confirmRemove() {
    if (!pendingRemove) return;
    void actions.removeMember(pendingRemove);
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

  async function saveRole(roleId: string) {
    const permissions = drafts[roleId];
    const role = roles.find((item) => item.id === roleId);
    if (!permissions || !role) return;
    if (await actions.saveRole(role, permissions)) discardDraft(roleId);
  }

  async function createRole(values: { name: string; description: string; copyFrom: string }) {
    const source = roles.find((role) => role.id === values.copyFrom);
    const role = await actions.createRole({
      name: values.name,
      description: values.description,
      permissions: source ? [...source.permissions] : [],
    });
    if (!role) return;
    setSelectedRoleId(role.id);
    setRoleDialogOpen(false);
  }

  async function confirmDeleteRole() {
    if (!pendingDeleteRole) return;
    const role = pendingDeleteRole;
    setPendingDeleteRole(null);
    if (await actions.deleteRole(role)) {
      discardDraft(role.id);
      setSelectedRoleId(OWNER_ROLE_ID);
    }
  }

  return (
    <div className="flex w-full flex-col gap-5 sm:gap-6">
      <StaffPageHeader
        shopCode={shopCode}
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
        อัปเดตล่าสุด {updatedAt} • เมื่อเปลี่ยนสิทธิ์ของบทบาท
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
        onConfirm={() => void confirmDeleteRole()}
        onCancel={() => setPendingDeleteRole(null)}
      />
    </div>
  );
}
