"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui";
import { cn } from "@/lib/cn";

type PasswordInputProps = Omit<ComponentProps<typeof Input>, "type"> & {
  /** แสดงปุ่มแสดง/ซ่อนรหัสผ่าน (ค่าเริ่มต้น: แสดง) */
  showToggle?: boolean;
};

/** ช่องรหัสผ่านพร้อมปุ่มแสดง/ซ่อนรหัส */
export function PasswordInput({
  className,
  showToggle = true,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        className={cn("h-12 text-[15px]", showToggle && "pr-12", className)}
        {...props}
      />
      {showToggle && (
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
          aria-pressed={visible}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-primary/50 absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center rounded-r-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <Icon className="size-[18px]" aria-hidden />
        </button>
      )}
    </div>
  );
}
