"use client";

import { useState, type FormEvent } from "react";
import { Button, Checkbox, FormField, Input } from "@/components/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { toApiError } from "@/lib/http/api-error";
import { notify } from "@/lib/toast";
import { authApi } from "@/features/auth/lib/auth-api";
import { OtpStep } from "./otp-step";
import { PasswordInput } from "./password-input";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  /** บัญชีที่ยังไม่ยืนยันอีเมล: backend ส่ง OTP ให้แล้ว พาไปกรอกรหัสต่อ */
  const [unverifiedEmail, setUnverifiedEmail] = useState<string>();
  /** ผู้ดูแลระบบที่เปิด 2FA: หลังรหัสผ่านถูก ต้องกรอกรหัส 6 หลักจากแอป Authenticator */
  const [needCode, setNeedCode] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    try {
      const email = String(form.get("email") ?? "").trim();
      const { data } = await authApi.login(
        email,
        String(form.get("password") ?? ""),
        form.get("remember") === "on",
        needCode ? String(form.get("code") ?? "").trim() : undefined,
      );
      notify.success("เข้าสู่ระบบสำเร็จ");
      router.push(data.user.role === "ADMIN" ? ROUTES.admin : ROUTES.dashboard);
    } catch (error) {
      const code = toApiError(error).code;
      if (code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(String(form.get("email") ?? "").trim());
      } else if (code === "TOTP_REQUIRED") {
        setNeedCode(true);
      } else {
        notify.error(error);
      }
    } finally {
      setLoading(false);
    }
  }

  if (unverifiedEmail) {
    return (
      <OtpStep
        email={unverifiedEmail}
        onBack={() => setUnverifiedEmail(undefined)}
        onVerified={() => router.push(ROUTES.onboardingPlan)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-foreground text-[26px] leading-tight font-semibold">
          เข้าสู่ระบบ
        </h1>
        <p className="text-muted-foreground text-sm">
          จัดการออร์เดอร์และดูยอดขายของร้านคุณต่อได้เลย
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <FormField label="อีเมล" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@restaurant.com"
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
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <Checkbox
            name="remember"
            label={
              <span className="flex flex-col gap-0.5">
                <span className="text-foreground font-medium">
                  จดจำฉันไว้ในอุปกรณ์นี้
                </span>
              </span>
            }
          />
          <Link
            href={ROUTES.forgotPassword}
            className="text-primary-strong text-sm font-semibold underline-offset-2 hover:underline"
          >
            ลืมรหัสผ่าน?
          </Link>
        </div>
        {needCode && (
          <FormField label="รหัส 2FA 6 หลัก" htmlFor="code" hint="เปิดแอป Authenticator แล้วกรอกรหัสปัจจุบันของ SHARKZEN ORDER">
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              placeholder="000000"
              className="h-12 text-center text-lg tracking-[0.4em]"
              autoFocus
              required
            />
          </FormField>
        )}
        <Button type="submit" size="lg" loading={loading} className="h-[52px]">
          {needCode ? "ยืนยันและเข้าสู่ระบบ" : "เข้าสู่ระบบ"}
        </Button>
      </form>
      <p className="text-muted-foreground text-center text-sm">
        เป็นพนักงานของร้าน?{" "}
        <Link href={ROUTES.staffLogin} className="text-primary-strong font-semibold underline-offset-2 hover:underline">
          เข้าสู่ระบบพนักงาน
        </Link>
      </p>
    </div>
  );
}
