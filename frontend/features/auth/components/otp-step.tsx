"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui";
import { toApiError } from "@/lib/http/api-error";
import { notify } from "@/lib/toast";
import { authApi, maskEmail, type SessionUser } from "@/features/auth/lib/auth-api";
import { OtpInput } from "./otp-input";

const RESEND_SECONDS = 60;

interface OtpStepProps {
  email: string;
  /** รหัสถูกส่งไปแล้วก่อนเข้าหน้านี้ (สมัครใหม่/เข้าสู่ระบบด้วยบัญชีที่ยังไม่ยืนยัน) */
  onVerified: (user: SessionUser) => void;
  onBack: () => void;
}

/** ขั้นยืนยันอีเมลด้วย OTP 6 หลัก ใช้ทั้งตอนสมัครและตอนเข้าสู่ระบบด้วยบัญชีที่ยังไม่ยืนยัน */
export function OtpStep({ email, onVerified, onBack }: OtpStepProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function submit(value: string) {
    if (value.length !== 6 || loading) return;
    setLoading(true);
    setError(undefined);
    try {
      const { data } = await authApi.verifyEmail(email, value);
      notify.success("ยืนยันอีเมลสำเร็จ", "ยินดีต้อนรับสู่ SHARKZEN ORDER");
      onVerified(data.user);
    } catch (e) {
      const apiError = toApiError(e);
      setError(apiError.message);
      setCode("");
      if (apiError.code === "OTP_LOCKED" || apiError.code === "OTP_EXPIRED") {
        setLocked(true);
        setSecondsLeft(0);
      }
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setResending(true);
    try {
      await authApi.resendOtp(email);
      notify.success("ส่งรหัสใหม่แล้ว", `ตรวจสอบกล่องจดหมายของ ${maskEmail(email)}`);
      setCode("");
      setError(undefined);
      setLocked(false);
      setSecondsLeft(RESEND_SECONDS);
    } catch (e) {
      notify.error(e);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        <span className="bg-primary-soft text-primary-strong flex size-12 items-center justify-center rounded-full">
          <MailCheck className="size-6" aria-hidden />
        </span>
        <h1 className="font-display text-foreground text-[26px] leading-tight font-semibold">
          ยืนยันอีเมลของคุณ
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          เราส่งรหัส 6 หลักไปที่{" "}
          <strong className="text-foreground">{maskEmail(email)}</strong>{" "}
          รหัสหมดอายุใน 10 นาที หากไม่เจอให้ตรวจโฟลเดอร์สแปม
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <OtpInput
          value={code}
          onChange={(v) => {
            setCode(v);
            setError(undefined);
          }}
          onComplete={submit}
          disabled={loading || locked}
          invalid={!!error}
        />
        <p role="alert" className="text-danger min-h-5 text-[13px]">
          {error}
        </p>
      </div>

      <Button
        size="lg"
        className="h-[52px]"
        loading={loading}
        disabled={code.length !== 6 || locked}
        onClick={() => submit(code)}
      >
        ยืนยันและเริ่มใช้งาน
      </Button>

      <div className="flex flex-col items-center gap-3 text-sm">
        <p className="text-muted-foreground">
          ยังไม่ได้รับรหัส?{" "}
          {secondsLeft > 0 ? (
            <span>ขอใหม่ได้ใน {secondsLeft} วินาที</span>
          ) : (
            <button
              type="button"
              onClick={resend}
              disabled={resending}
              className="text-primary-strong cursor-pointer font-semibold underline-offset-2 hover:underline disabled:opacity-50"
            >
              ส่งรหัสอีกครั้ง
            </button>
          )}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden />
          แก้ไขอีเมล
        </button>
      </div>
    </div>
  );
}
