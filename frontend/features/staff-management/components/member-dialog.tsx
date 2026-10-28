"use client";

import { useState, type FormEvent } from "react";
import { Button, Dialog, FormField, Input, Select } from "@/components/ui";
import { accessibleResources } from "@/features/staff-management/lib/permission-utils";
import { USERNAME_PATTERN, checkPassword } from "@/features/staff-management/lib/password";
import type { Role, StaffMember } from "@/features/staff-management/types";
import { PasswordField } from "./password-field";

export interface MemberValues {
  name: string;
  username: string;
  roleId: string;
  /** มีเฉพาะตอนสร้างบัญชีใหม่ */
  password?: string;
}

interface MemberDialogProps {
  /** null = ปิด, "new" = สร้างบัญชีใหม่, StaffMember = แก้ไขคนนั้น */
  target: StaffMember | "new" | null;
  roles: Role[];
  members: StaffMember[];
  onClose: () => void;
  onSubmit: (values: MemberValues) => void | Promise<unknown>;
}

/** ฟอร์มสร้าง/แก้ไขบัญชีพนักงาน เลือกบทบาทแล้วเห็นทันทีว่าบทบาทนั้นเข้าหน้าไหนได้บ้าง */
export function MemberDialog(props: MemberDialogProps) {
  const { target, onClose } = props;
  return (
    <Dialog
      open={target !== null}
      title={target === "new" ? "สร้างบัญชีพนักงาน" : "แก้ไขพนักงาน"}
      onClose={onClose}
      className="w-[min(94vw,520px)]"
    >
      {/* แยกฟอร์มเป็นคอมโพเนนต์ย่อยเพื่อให้ state รีเซ็ตทุกครั้งที่เปิด (Dialog ไม่ render children ตอนปิด) */}
      {target !== null && <MemberForm {...props} target={target} />}
    </Dialog>
  );
}

function MemberForm({
  target,
  roles,
  members,
  onClose,
  onSubmit,
}: MemberDialogProps & { target: StaffMember | "new" }) {
  const editing = target === "new" ? null : target;
  const assignable = roles.filter((role) => !role.locked);

  const [name, setName] = useState(editing?.name ?? "");
  const [username, setUsername] = useState(editing?.username ?? "");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState(
    editing?.roleId ?? assignable[0]?.id ?? "",
  );
  const [submitted, setSubmitted] = useState(false);

  const trimmedUsername = username.trim();
  const errors = {
    name: name.trim() ? "" : "กรอกชื่อพนักงาน",
    username: !trimmedUsername
      ? "ตั้งชื่อผู้ใช้สำหรับเข้าสู่ระบบ"
      : !USERNAME_PATTERN.test(trimmedUsername)
        ? "ใช้ a-z ตัวเลข จุด หรือขีดล่าง ยาว 4–20 ตัว เช่น somchai.k"
        : members.some(
              (member) =>
                member.id !== editing?.id &&
                member.username === trimmedUsername,
            )
          ? "ชื่อผู้ใช้นี้มีคนใช้แล้ว"
          : "",
    password: editing ? "" : checkPassword(password),
  };

  const role = roles.find((item) => item.id === roleId);
  const pages = role ? accessibleResources(role.permissions) : [];

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (errors.name || errors.username || errors.password) return;
    onSubmit({
      name: name.trim(),
      username: trimmedUsername,
      roleId,
      ...(editing ? {} : { password }),
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-1">
          <p aria-hidden className="font-display pr-10 text-xl font-semibold">
            {editing ? "แก้ไขพนักงาน" : "สร้างบัญชีพนักงาน"}
          </p>
          <p className="text-muted-foreground text-[13px]">
            {editing
              ? "เปลี่ยนชื่อ ชื่อผู้ใช้ หรือบทบาทของพนักงาน หากลืมรหัสผ่านให้ใช้ปุ่มรีเซ็ตรหัสผ่านในรายชื่อ"
              : "ตั้งชื่อผู้ใช้และรหัสผ่านให้พนักงาน แล้วแจ้งพนักงานโดยตรง พนักงานจะต้องเปลี่ยนรหัสผ่านเองเมื่อเข้าสู่ระบบครั้งแรก"}
          </p>
        </div>

        <FormField
          label="ชื่อ-นามสกุล"
          htmlFor="member-name"
          required
          error={submitted ? errors.name : ""}
        >
          <Input
            id="member-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            invalid={submitted && !!errors.name}
            autoComplete="off"
            autoFocus
          />
        </FormField>

        <FormField
          label="ชื่อผู้ใช้"
          htmlFor="member-username"
          required
          hint="ใช้เข้าสู่ระบบ ตัวพิมพ์เล็กเท่านั้น"
          error={submitted ? errors.username : ""}
        >
          <Input
            id="member-username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            invalid={submitted && !!errors.username}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
          />
        </FormField>

        {!editing && (
          <PasswordField
            id="member-password"
            label="รหัสผ่านเริ่มต้น"
            value={password}
            error={submitted ? errors.password : ""}
            onChange={setPassword}
          />
        )}

        <FormField label="บทบาท" htmlFor="member-role" required>
          <Select
            id="member-role"
            value={roleId}
            onChange={setRoleId}
            options={assignable.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
          />
        </FormField>

        {role && (
          <div className="bg-muted flex flex-col gap-2 rounded-lg p-3.5">
            <p className="text-muted-foreground text-xs">{role.description}</p>
            <p className="text-foreground text-xs font-semibold">
              เข้าได้ {pages.length} หน้า
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {pages.length > 0 ? (
                pages.map((page) => (
                  <li
                    key={page.id}
                    className="bg-surface border-border text-foreground rounded-md border px-2 py-0.5 text-xs"
                  >
                    {page.label}
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground text-xs">
                  บทบาทนี้ยังไม่ได้รับสิทธิ์เข้าหน้าใด
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="border-border flex justify-end gap-3 border-t px-6 py-4">
        <Button variant="outline" onClick={onClose}>
          ยกเลิก
        </Button>
        <Button type="submit">
          {editing ? "บันทึกการแก้ไข" : "สร้างบัญชี"}
        </Button>
      </div>
    </form>
  );
}
