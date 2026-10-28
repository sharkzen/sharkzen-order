"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LinkIcon } from "lucide-react";
import { Button, FormField } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { toApiError } from "@/lib/http/api-error";
import { notify } from "@/lib/toast";
import { authApi } from "@/features/auth/lib/auth-api";
import { PasswordInput } from "./password-input";
import { PasswordStrengthMeter } from "./password-strength-meter";

type Errors = Partial<Record<"password" | "confirm", string>>;

function InvalidLink() {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        <span className="bg-danger-soft text-danger-strong flex size-12 items-center justify-center rounded-full">
          <LinkIcon className="size-6" aria-hidden />
        </span>
        <h1 className="font-display text-foreground text-[26px] leading-tight font-semibold">
          ลิงก์ไม่ถูกต้องหรือหมดอายุ
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          ลิงก์ตั้งรหัสผ่านใช้ได้ 30 นาทีและใช้ได้ครั้งเดียว กรุณาขอลิงก์ใหม่
        </p>
      </div>
      <Link
        href={ROUTES.forgotPassword}
        className="bg-primary text-primary-foreground hover:bg-primary-strong inline-flex h-[52px] items-center justify-center rounded-lg font-semibold transition-colors"
      >
        ขอลิงก์ใหม่
      </Link>
    </div>
  );
}

export function ResetPasswordForm({ token }: { token?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [expired, setExpired] = useState(false);

  if (!token || expired) return <InvalidLink />;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const next = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    const found: Errors = {};
    if (next.length < 8) found.password = "ตั้งรหัสผ่านอย่างน้อย 8 ตัวอักษร";
    if (confirm !== next) found.confirm = "รหัสผ่านทั้งสองช่องไม่ตรงกัน";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await authApi.resetPassword(token!, next);
      notify.success("ตั้งรหัสผ่านใหม่แล้ว", "เข้าสู่ระบบด้วยรหัสผ่านใหม่ได้เลย");
      router.push(ROUTES.login);
    } catch (error) {
      if (toApiError(error).code === "RESET_TOKEN_INVALID") setExpired(true);
      else notify.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-foreground text-[26px] leading-tight font-semibold">
          ตั้งรหัสผ่านใหม่
        </h1>
        <p className="text-muted-foreground text-sm">
          เลือกรหัสผ่านที่คาดเดายากและไม่ซ้ำกับบริการอื่น
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-2.5">
          <FormField label="รหัสผ่านใหม่" htmlFor="password" error={errors.password}>
            <PasswordInput
              showToggle={false}
              id="password"
              name="password"
              autoComplete="new-password"
              placeholder="อย่างน้อย 8 ตัวอักษร"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              invalid={!!errors.password}
            />
          </FormField>
          <PasswordStrengthMeter password={password} />
        </div>
        <FormField label="ยืนยันรหัสผ่านใหม่" htmlFor="confirm" error={errors.confirm}>
          <PasswordInput
            showToggle={false}
            id="confirm"
            name="confirm"
            autoComplete="new-password"
            invalid={!!errors.confirm}
          />
        </FormField>
        <Button type="submit" size="lg" loading={loading} className="h-[52px]">
          บันทึกรหัสผ่านใหม่
        </Button>
      </form>
    </div>
  );
}
