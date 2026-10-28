"use client";

import { Lock, Plus, Trash2 } from "lucide-react";
import { Button, Card, Checkbox, Switch } from "@/components/ui";
import { cn } from "@/lib/cn";
import { RESOURCES } from "@/features/staff-management/data/permissions";
import {
  accessibleResources,
  canView,
  permissionKey,
  setPermission,
} from "@/features/staff-management/lib/permission-utils";
import type { PermissionKey, Role, StaffMember } from "@/features/staff-management/types";

interface RolesPanelProps {
  roles: Role[];
  members: StaffMember[];
  selectedId: string;
  /** สิทธิ์ที่กำลังแก้ (ยังไม่บันทึก) แยกตามบทบาท */
  drafts: Record<string, PermissionKey[]>;
  canEdit: boolean;
  onSelect: (id: string) => void;
  onChangeDraft: (roleId: string, permissions: PermissionKey[]) => void;
  onSave: (roleId: string) => void;
  onDiscard: (roleId: string) => void;
  onCreate: () => void;
  onDelete: (role: Role) => void;
}

/** ซ้าย: รายการบทบาท / ขวา: ตารางสิทธิ์ของบทบาทที่เลือก (หน้า × การกระทำ) */
export function RolesPanel({
  roles,
  members,
  selectedId,
  drafts,
  canEdit,
  onSelect,
  onChangeDraft,
  onSave,
  onDiscard,
  onCreate,
  onDelete,
}: RolesPanelProps) {
  const role = roles.find((item) => item.id === selectedId) ?? roles[0];
  const permissions = drafts[role.id] ?? role.permissions;
  const dirty = role.id in drafts;
  const editable = canEdit && !role.locked;
  const memberCount = members.filter((m) => m.roleId === role.id).length;

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Card className="flex flex-col gap-1 p-2">
        <ul aria-label="บทบาท" className="flex flex-col gap-1">
          {roles.map((item) => {
            const active = item.id === role.id;
            const count = members.filter((m) => m.roleId === item.id).length;
            const pages = accessibleResources(
              drafts[item.id] ?? item.permissions,
            ).length;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-current={active}
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    "focus-visible:ring-primary/50 flex w-full cursor-pointer flex-col gap-0.5 rounded-lg px-3.5 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none",
                    active ? "bg-primary-soft" : "hover:bg-muted",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        active ? "text-primary-strong" : "text-foreground",
                      )}
                    >
                      {item.name}
                    </span>
                    {item.locked && (
                      <Lock
                        className="text-muted-foreground size-3"
                        aria-label="ล็อกไว้"
                      />
                    )}
                    {item.id in drafts && (
                      <span className="text-warning-strong bg-warning-soft rounded px-1.5 text-[10px] font-semibold">
                        ยังไม่บันทึก
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {count} คน • เข้าได้ {pages} หน้า
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            className="m-1.5"
            onClick={onCreate}
          >
            <Plus className="size-4" aria-hidden />
            สร้างบทบาทใหม่
          </Button>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-border flex flex-wrap items-start justify-between gap-3 border-b p-5">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="font-display text-foreground text-lg font-semibold">
              สิทธิ์ของ {role.name}
            </h2>
            <p className="text-muted-foreground text-[13px]">
              {role.description || "ยังไม่มีคำอธิบาย"} • ใช้กับ {memberCount} คน
            </p>
          </div>
          {editable && !role.builtin && (
            <Button
              variant="ghost"
              size="sm"
              disabled={memberCount > 0}
              title={
                memberCount > 0
                  ? "ย้ายพนักงานไปบทบาทอื่นก่อนจึงจะลบได้"
                  : undefined
              }
              onClick={() => onDelete(role)}
              className="text-danger-strong hover:bg-danger-soft"
            >
              <Trash2 className="size-4" aria-hidden />
              ลบบทบาท
            </Button>
          )}
        </div>

        {role.locked && (
          <p className="bg-primary-soft text-primary-strong flex items-center gap-2 px-5 py-3 text-[13px]">
            <Lock className="size-4 shrink-0" aria-hidden />
            เจ้าของร้านเข้าถึงได้ทุกหน้าและทำได้ทุกอย่าง แก้ไขสิทธิ์ไม่ได้
          </p>
        )}
        {!canEdit && !role.locked && (
          <p className="bg-muted text-muted-foreground px-5 py-3 text-[13px]">
            คุณดูสิทธิ์ได้อย่างเดียว ต้องมีสิทธิ์
            &quot;จัดการบทบาทและสิทธิ์&quot; จึงจะแก้ไขได้
          </p>
        )}

        <ul>
          {RESOURCES.map((resource) => {
            const Icon = resource.icon;
            const allowed = canView(permissions, resource);
            const extras = resource.actions.filter(
              (action) => action.id !== "view",
            );
            return (
              <li
                key={resource.id}
                className="border-border flex flex-col gap-3 border-b px-5 py-4 last:border-b-0 sm:flex-row sm:items-start sm:gap-5"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <Icon
                    className={cn(
                      "mt-0.5 size-[18px] shrink-0",
                      allowed ? "text-primary" : "text-muted-foreground",
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-foreground text-sm font-semibold">
                      {resource.label}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {resource.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:w-[270px]">
                  <label className="flex items-center justify-between gap-3 text-[13px] font-medium">
                    <span id={`view-${resource.id}`}>เข้าหน้านี้ได้</span>
                    <Switch
                      checked={allowed}
                      disabled={!editable}
                      aria-labelledby={`view-${resource.id}`}
                      onCheckedChange={(on) =>
                        onChangeDraft(
                          role.id,
                          setPermission(permissions, resource, "view", on),
                        )
                      }
                    />
                  </label>
                  {extras.length > 0 && (
                    <div
                      role="group"
                      aria-label={`สิ่งที่ทำได้ใน${resource.label}`}
                      className={cn(
                        "flex flex-col gap-2 border-l-2 pl-3.5",
                        allowed
                          ? "border-primary-muted"
                          : "border-border opacity-50",
                      )}
                    >
                      {extras.map((action) => (
                        <Checkbox
                          key={action.id}
                          label={action.label}
                          checked={permissions.includes(
                            permissionKey(resource, action.id),
                          )}
                          disabled={!editable || !allowed}
                          onChange={(e) =>
                            onChangeDraft(
                              role.id,
                              setPermission(
                                permissions,
                                resource,
                                action.id,
                                e.target.checked,
                              ),
                            )
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {dirty && (
          <div
            role="status"
            className="border-border bg-surface sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3.5"
          >
            <p className="text-foreground text-[13px]">
              มีการแก้ไขที่ยังไม่บันทึก มีผลกับ {memberCount} คนในบทบาทนี้
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDiscard(role.id)}
              >
                ยกเลิกการแก้ไข
              </Button>
              <Button size="sm" onClick={() => onSave(role.id)}>
                บันทึกสิทธิ์
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
