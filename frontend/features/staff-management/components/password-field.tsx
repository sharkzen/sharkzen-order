"use client";

import { Dices } from "lucide-react";
import { PasswordInput } from "@/features/auth/components/password-input";
import { PasswordStrengthMeter } from "@/features/auth/components/password-strength-meter";
import { Button, FormField } from "@/components/ui";
import { generatePassword } from "../lib/password";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

/** ช่องตั้งรหัสผ่านให้พนักงาน: แสดง/ซ่อนได้ มีตัวบอกความแข็งแรง และปุ่มสุ่มรหัสที่อ่านง่าย */
export function PasswordField({
  id,
  label,
  value,
  error,
  onChange,
}: PasswordFieldProps) {
  return (
    <FormField label={label} htmlFor={id} required error={error}>
      <div className="flex flex-col gap-2.5">
        <PasswordInput
          id={id}
          value={value}
          invalid={!!error}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
          className="h-10 text-sm"
        />
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <PasswordStrengthMeter password={value} />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange(generatePassword())}
          >
            <Dices className="size-4" aria-hidden />
            สุ่มรหัสผ่าน
          </Button>
        </div>
      </div>
    </FormField>
  );
}
