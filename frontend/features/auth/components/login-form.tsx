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

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    try {
      const email = String(form.get("email") ?? "").trim();
      await authApi.login(
        email,
        String(form.get("password") ?? ""),
        form.get("remember") === "on",
      );
      notify.success("เข้าสู่ระบบสำเร็จ");
      router.push(ROUTES.dashboard);
    } catch (error) {
      if (toApiError(error).code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(String(form.get("email") ?? "").trim());
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
        <Button type="submit" size="lg" loading={loading} className="h-[52px]">
          เข้าสู่ระบบ
        </Button>
      </form>
    </div>
  );
}
