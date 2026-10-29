"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, FormField } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { authApi } from "@/features/auth/lib/auth-api";
import { homeFor } from "@/features/auth/lib/access";
import { ApiError } from "@/lib/http/api-error";
import { notify } from "@/lib/toast";
import { PasswordInput } from "./password-input";

/** พนักงานตั้งรหัสผ่านของตัวเองครั้งแรก (รหัสตั้งต้นที่เจ้าของร้านให้ใช้ต่อไม่ได้) */
export function StaffPasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const next = String(form.get("newPassword") ?? "");
    if (next !== String(form.get("confirm") ?? "")) return setError("รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน");
    setError(undefined);
    setLoading(true);
    try {
      await authApi.staffChangePassword(String(form.get("currentPassword") ?? ""), next);
      const { data } = await authApi.me();
      notify.success("เปลี่ยนรหัสผ่านแล้ว");
      router.replace(homeFor(data.user));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) router.replace(ROUTES.staffLogin);
      else setError(e instanceof Error ? e.message : "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-foreground text-[26px] leading-tight font-semibold">ตั้งรหัสผ่านใหม่</h1>
        <p className="text-muted-foreground text-sm">เพื่อความปลอดภัย กรุณาเปลี่ยนรหัสผ่านที่เจ้าของร้านตั้งให้ก่อนเริ่มใช้งาน</p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <FormField label="รหัสผ่านปัจจุบัน" htmlFor="currentPassword">
          <PasswordInput id="currentPassword" name="currentPassword" autoComplete="current-password" required />
        </FormField>
        <FormField label="รหัสผ่านใหม่" htmlFor="newPassword" hint="อย่างน้อย 8 ตัวอักษร">
          <PasswordInput id="newPassword" name="newPassword" autoComplete="new-password" required />
        </FormField>
        <FormField label="ยืนยันรหัสผ่านใหม่" htmlFor="confirm">
          <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required />
        </FormField>
        {error && (
          <p role="alert" className="bg-danger-soft text-danger-strong rounded-lg px-3 py-2.5 text-sm">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" loading={loading} className="h-[52px]">
          บันทึกรหัสผ่านใหม่
        </Button>
      </form>
    </div>
  );
}
