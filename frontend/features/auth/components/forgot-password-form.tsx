"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { Button, FormField, Input } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { notify } from "@/lib/toast";
import { authApi } from "../lib/auth-api";

const RESEND_SECONDS = 60;

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string>();
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function send(email: string) {
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSentTo(email);
      setSecondsLeft(RESEND_SECONDS);
    } catch (e) {
      notify.error(e);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("กรอกอีเมลให้ถูกต้อง เช่น you@restaurant.com");
      return;
    }
    setError(undefined);
    void send(email);
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-3">
          <span className="bg-primary-soft text-primary-strong flex size-12 items-center justify-center rounded-full">
            <MailCheck className="size-6" aria-hidden />
          </span>
          <h1 className="font-display text-foreground text-[26px] leading-tight font-semibold">
            ตรวจสอบอีเมลของคุณ
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            หาก <strong className="text-foreground">{sentTo}</strong>{" "}
            มีบัญชีอยู่ในระบบ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ให้แล้ว ลิงก์ใช้ได้ 30
            นาที หากไม่เจอให้ตรวจโฟลเดอร์สแปม
          </p>
        </div>
        <Button
          variant="outline"
          size="lg"
          className="h-[52px]"
          loading={loading}
          disabled={secondsLeft > 0}
          onClick={() => send(sentTo)}
        >
          {secondsLeft > 0 ? `ส่งอีกครั้งได้ใน ${secondsLeft} วินาที` : "ส่งลิงก์อีกครั้ง"}
        </Button>
        <button
          type="button"
          onClick={() => setSentTo(undefined)}
          className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center justify-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden />
          ใช้อีเมลอื่น
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-foreground text-[26px] leading-tight font-semibold">
          ลืมรหัสผ่าน
        </h1>
        <p className="text-muted-foreground text-sm">
          กรอกอีเมลที่ใช้สมัคร เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <FormField label="อีเมล" htmlFor="email" error={error}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@restaurant.com"
            className="h-12 text-[15px]"
            invalid={!!error}
          />
        </FormField>
        <Button type="submit" size="lg" loading={loading} className="h-[52px]">
          ส่งลิงก์ตั้งรหัสผ่านใหม่
        </Button>
      </form>

      <Link
        href={ROUTES.login}
        className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden />
        กลับไปเข้าสู่ระบบ
      </Link>
    </div>
  );
}
