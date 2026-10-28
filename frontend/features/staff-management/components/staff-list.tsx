import { Ban, KeyRound, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui";
import type { BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { accessSummary } from "@/features/staff-management/lib/permission-utils";
import type { Role, StaffMember, StaffStatus } from "@/features/staff-management/types";

const STATUS_BADGE: Record<
  StaffStatus,
  { label: string; tone: NonNullable<BadgeProps["tone"]> }
> = {
  active: { label: "ใช้งานอยู่", tone: "success" },
  suspended: { label: "ระงับการใช้งาน", tone: "danger" },
};

const GRID =
  "md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_150px_150px] md:items-center md:gap-4";

interface StaffListProps {
  members: StaffMember[];
  roles: Role[];
  /** แก้ไข ระงับ และลบพนักงานได้ (staff.manage) */
  canManage: boolean;
  /** รีเซ็ตรหัสผ่านพนักงานได้ (staff.reset_password) */
  canResetPassword: boolean;
  onResetPassword: (member: StaffMember) => void;
  onEdit: (member: StaffMember) => void;
  onToggleSuspend: (member: StaffMember) => void;
  onRemove: (member: StaffMember) => void;
}

/** รายชื่อทีมงาน จอกลางขึ้นไปเป็นแถวตาราง จอเล็กเป็นการ์ด */
export function StaffList({
  members,
  roles,
  canManage,
  canResetPassword,
  onResetPassword,
  onEdit,
  onToggleSuspend,
  onRemove,
}: StaffListProps) {
  return (
    <div>
      <div
        aria-hidden
        className={cn(
          "border-border text-muted-foreground hidden border-b px-5 py-3 text-xs font-medium",
          GRID,
        )}
      >
        <span>พนักงาน</span>
        <span>บทบาทและการเข้าถึง</span>
        <span>สถานะ</span>
        <span className="text-right">จัดการ</span>
      </div>
      <ul>
        {members.map((member) => {
          const role = roles.find((item) => item.id === member.roleId);
          const status =
            member.status === "active" && member.mustChangePassword
              ? { label: "รอตั้งรหัสผ่านใหม่", tone: "warning" as const }
              : STATUS_BADGE[member.status];
          const isOwner = role?.locked ?? false;
          const suspended = member.status === "suspended";

          return (
            <li
              key={member.id}
              className={cn(
                "border-border flex flex-col gap-3 border-b px-4 py-4 last:border-b-0 sm:px-5",
                GRID,
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden
                  className={cn(
                    "font-display flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                    suspended
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary-soft text-primary-strong",
                  )}
                >
                  {member.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="text-foreground truncate text-sm font-semibold">
                    {member.name}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    @{member.username}
                  </p>
                </div>
              </div>

              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-foreground text-[13px] font-medium">
                  {role?.name ?? "ไม่พบบทบาท"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {accessSummary(role)}
                </p>
              </div>

              <div className="flex flex-col items-start gap-1">
                <Badge tone={status.tone} className="text-xs">
                  {status.label}
                </Badge>
                <p className="text-muted-foreground text-[11px]">
                  {member.lastActive}
                </p>
              </div>

              <div className="flex justify-end gap-1">
                {isOwner ? (
                  <span className="text-muted-foreground text-xs">
                    แก้ไขไม่ได้
                  </span>
                ) : (
                  <>
                    {canResetPassword && (
                      <IconButton
                        label={`รีเซ็ตรหัสผ่านของ ${member.name}`}
                        onClick={() => onResetPassword(member)}
                      >
                        <KeyRound className="size-4" aria-hidden />
                      </IconButton>
                    )}
                    {canManage && (
                      <>
                        <IconButton
                          label={`แก้ไข ${member.name}`}
                          onClick={() => onEdit(member)}
                        >
                          <Pencil className="size-4" aria-hidden />
                        </IconButton>
                        <IconButton
                          label={`${suspended ? "เปิดใช้งาน" : "ระงับ"} ${member.name}`}
                          onClick={() => onToggleSuspend(member)}
                        >
                          {suspended ? (
                            <RotateCcw className="size-4" aria-hidden />
                          ) : (
                            <Ban className="size-4" aria-hidden />
                          )}
                        </IconButton>
                        <IconButton
                          label={`ลบ ${member.name}`}
                          danger
                          onClick={() => onRemove(member)}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </IconButton>
                      </>
                    )}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function IconButton({
  label,
  danger = false,
  onClick,
  children,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "focus-visible:ring-primary/50 flex size-9 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none",
        danger
          ? "text-danger-strong hover:bg-danger-soft"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
