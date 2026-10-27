"use client";

import { useState, type FormEvent } from "react";
import { Button, Dialog, FormField, Input, Select } from "@/components/ui";
import type { Role } from "../types";

interface RoleDialogProps {
  open: boolean;
  roles: Role[];
  onClose: () => void;
  onSubmit: (values: {
    name: string;
    description: string;
    copyFrom: string;
  }) => void;
}

/** สร้างบทบาทใหม่ จะคัดลอกสิทธิ์เริ่มต้นจากบทบาทเดิมก็ได้ แล้วค่อยปรับในตารางสิทธิ์ */
export function RoleDialog(props: RoleDialogProps) {
  return (
    <Dialog open={props.open} title="สร้างบทบาทใหม่" onClose={props.onClose}>
      {props.open && <RoleForm {...props} />}
    </Dialog>
  );
}

function RoleForm({ roles, onClose, onSubmit }: RoleDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [copyFrom, setCopyFrom] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const trimmed = name.trim();
  const error = !trimmed
    ? "ตั้งชื่อบทบาท เช่น หัวหน้ากะ"
    : roles.some((role) => role.name === trimmed)
      ? "มีบทบาทชื่อนี้อยู่แล้ว"
      : "";

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (error) return;
    onSubmit({ name: trimmed, description: description.trim(), copyFrom });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-1">
          <p aria-hidden className="font-display pr-10 text-xl font-semibold">
            สร้างบทบาทใหม่
          </p>
          <p className="text-muted-foreground text-[13px]">
            ตั้งชื่อก่อน แล้วเลือกสิทธิ์ในตารางที่หน้าถัดไป
          </p>
        </div>
        <FormField
          label="ชื่อบทบาท"
          htmlFor="role-name"
          required
          error={submitted ? error : ""}
        >
          <Input
            id="role-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            invalid={submitted && !!error}
            autoComplete="off"
            autoFocus
          />
        </FormField>
        <FormField
          label="คำอธิบาย"
          htmlFor="role-description"
          hint="ไม่บังคับ ช่วยให้คนอื่นเข้าใจว่าบทบาทนี้ใช้กับใคร"
        >
          <Input
            id="role-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            autoComplete="off"
          />
        </FormField>
        <FormField label="เริ่มจากสิทธิ์ของ" htmlFor="role-copy">
          <Select
            id="role-copy"
            value={copyFrom}
            onChange={(e) => setCopyFrom(e.target.value)}
            options={[
              { value: "", label: "ไม่มีสิทธิ์ใดๆ (เริ่มว่าง)" },
              ...roles.map((role) => ({ value: role.id, label: role.name })),
            ]}
          />
        </FormField>
      </div>
      <div className="border-border flex justify-end gap-3 border-t px-6 py-4">
        <Button variant="outline" onClick={onClose}>
          ยกเลิก
        </Button>
        <Button type="submit">สร้างบทบาท</Button>
      </div>
    </form>
  );
}
