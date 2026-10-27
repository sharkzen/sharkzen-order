"use client";

import { useState, type FormEvent } from "react";
import { Button, Dialog } from "@/components/ui";
import { checkPassword } from "../lib/password";
import type { StaffMember } from "../types";
import { PasswordField } from "./password-field";

interface ResetPasswordDialogProps {
  member: StaffMember | null;
  onClose: () => void;
  onSubmit: (member: StaffMember, password: string) => void;
}

/** รีเซ็ตรหัสผ่านให้พนักงานที่ลืม เจ้าของร้านหรือผู้จัดการตั้งรหัสใหม่ แล้วแจ้งพนักงานโดยตรง */
export function ResetPasswordDialog(props: ResetPasswordDialogProps) {
  const { member, onClose } = props;
  return (
    <Dialog
      open={member !== null}
      title="รีเซ็ตรหัสผ่าน"
      onClose={onClose}
      className="w-[min(94vw,460px)]"
    >
      {member && <ResetForm {...props} member={member} />}
    </Dialog>
  );
}

function ResetForm({
  member,
  onClose,
  onSubmit,
}: ResetPasswordDialogProps & { member: StaffMember }) {
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const error = checkPassword(password);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (error) return;
    onSubmit(member, password);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-1">
          <p aria-hidden className="font-display pr-10 text-xl font-semibold">
            รีเซ็ตรหัสผ่านของ {member.name}
          </p>
          <p className="text-muted-foreground text-[13px]">
            ชื่อผู้ใช้{" "}
            <strong className="text-foreground">@{member.username}</strong>{" "}
            รหัสผ่านเดิมจะใช้ไม่ได้ทันที
            และพนักงานต้องตั้งรหัสผ่านใหม่เองเมื่อเข้าสู่ระบบครั้งถัดไป
          </p>
        </div>
        <PasswordField
          id="reset-password"
          label="รหัสผ่านใหม่"
          value={password}
          error={submitted ? error : ""}
          onChange={setPassword}
        />
      </div>
      <div className="border-border flex justify-end gap-3 border-t px-6 py-4">
        <Button variant="outline" onClick={onClose}>
          ยกเลิก
        </Button>
        <Button type="submit">รีเซ็ตรหัสผ่าน</Button>
      </div>
    </form>
  );
}
