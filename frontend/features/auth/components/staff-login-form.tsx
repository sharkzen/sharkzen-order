"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Checkbox, FormField, Input } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { authApi } from "@/features/auth/lib/auth-api";
import { homeFor } from "@/features/auth/lib/access";
import { toApiError } from "@/lib/http/api-error";
import { notify } from "@/lib/toast";
import { PasswordInput } from "./password-input";

/** เข้าสู่ระบบของพนักงาน: รหัสร้าน (เจ้าของร้านดูได้ที่หน้าพนักงาน) + ชื่อผู้ใช้ + รหัสผ่าน */
export function StaffLoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    try {
      const { data } = await authApi.staffLogin(
        String(form.get("shopCode") ?? "").trim(),
        String(form.get("username") ?? "").trim(),
        String(form.get("password") ?? ""),
        form.get("remember") === "on",
      );
      notify.success("เข้าสู่ระบบสำเร็จ");
      router.push(
        data.user.mustChangePassword
          ? ROUTES.staffPassword
          : homeFor(data.user),
      );
    } catch (error) {
      // ถูกระงับ/แบน: หน้าต่างแจ้งสถานะขึ้นเองจาก interceptor จึงไม่ต้องแจ้งซ้ำ
      const code = toApiError(error).code;
      if (code !== "ACCOUNT_BANNED" && code !== "SHOP_SUSPENDED")
        notify.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-foreground text-[26px] leading-tight font-semibold">
          เข้าสู่ระบบพนักงาน
        </h1>
        <p className="text-muted-foreground text-sm">
          ใช้รหัสร้านและบัญชีที่เจ้าของร้านสร้างให้
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <FormField
          label="รหัสร้าน"
          htmlFor="shopCode"
          hint="เจ้าของร้านดูได้ที่หน้าพนักงาน"
        >
          <Input
            id="shopCode"
            name="shopCode"
            autoComplete="organization"
            autoCapitalize="characters"
            placeholder="เช่น ABCD1234"
            className="h-12 text-[15px] tracking-widest uppercase"
            required
          />
        </FormField>
        <FormField label="ชื่อผู้ใช้" htmlFor="username">
          <Input
            id="username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            className="h-12 text-[15px]"
            required
          />
        </FormField>
        <FormField label="รหัสผ่าน" htmlFor="password">
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="กรอกรหัสผ่าน"
            required
          />
        </FormField>
        <Checkbox
          name="remember"
          label={
            <span className="text-foreground font-medium">
              จดจำฉันไว้ในอุปกรณ์นี้
            </span>
          }
        />
        <Button type="submit" size="lg" loading={loading} className="h-[52px]">
          เข้าสู่ระบบ
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        เป็นเจ้าของร้าน?{" "}
        <Link
          href={ROUTES.login}
          className="text-primary-strong font-semibold underline-offset-2 hover:underline"
        >
          เข้าสู่ระบบเจ้าของร้าน
        </Link>
      </p>
    </div>
  );
}
