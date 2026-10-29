"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Button, Card, FormField, Input } from "@/components/ui";
import { authApi, type SessionUser } from "@/features/auth/lib/auth-api";
import { QrCode } from "@/features/table-management/components/qr-code";
import { notify } from "@/lib/toast";

interface TotpSetupProps {
  onDone: (user: SessionUser) => void;
}

/** บังคับตั้ง 2FA ก่อนใช้พื้นที่ผู้ดูแลระบบ: สแกน QR ด้วยแอป Authenticator แล้วยืนยันด้วยรหัสแรก */
export function TotpSetup({ onDone }: TotpSetupProps) {
  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string }>();
  const [starting, setStarting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function start() {
    setStarting(true);
    try {
      setSetup(await authApi.totpSetup());
    } catch (e) {
      notify.error(e);
    } finally {
      setStarting(false);
    }
  }

  async function verify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "").trim();
    setVerifying(true);
    try {
      const { user } = await authApi.totpEnable(code);
      notify.success("เปิดใช้ 2FA แล้ว", "ครั้งต่อไปที่เข้าสู่ระบบต้องกรอกรหัสจากแอปด้วย");
      onDone(user);
    } catch (err) {
      notify.error(err);
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="bg-background flex min-h-dvh flex-1 items-center justify-center p-4">
      <Card className="flex w-full max-w-[460px] flex-col gap-6 p-6 sm:p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="bg-primary-soft text-primary flex size-14 items-center justify-center rounded-full">
            <ShieldCheck className="size-7" aria-hidden />
          </span>
          <h1 className="font-display text-foreground text-2xl font-semibold">เปิดใช้การยืนยันตัวตน 2 ขั้นตอน</h1>
          <p className="text-muted-foreground text-sm">
            บัญชีผู้ดูแลระบบมีสิทธิ์สูงสุด ระบบจึงบังคับใช้รหัสจากแอป Authenticator (Google Authenticator, Authy, 1Password) ร่วมกับรหัสผ่าน
          </p>
        </div>

        {!setup ? (
          <Button size="lg" loading={starting} onClick={start}>
            <KeyRound className="size-[18px]" aria-hidden />
            เริ่มตั้งค่า
          </Button>
        ) : (
          <form onSubmit={verify} className="flex flex-col gap-5">
            <ol className="text-muted-foreground flex flex-col gap-1 text-[13px]">
              <li>1. เปิดแอป Authenticator แล้วสแกน QR นี้</li>
              <li>2. กรอกรหัส 6 หลักที่แอปแสดงเพื่อยืนยัน</li>
            </ol>
            <QrCode value={setup.otpauthUrl} label="QR สำหรับตั้งค่า 2FA" className="border-border mx-auto w-52 rounded-xl border p-2" />
            <p className="text-muted-foreground text-center text-xs">
              สแกนไม่ได้? กรอกรหัสนี้ในแอปเอง
              <span className="text-foreground mt-1 block font-mono text-sm break-all select-all">{setup.secret}</span>
            </p>
            <FormField label="รหัส 6 หลัก" htmlFor="totp-code">
              <Input
                id="totp-code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                placeholder="000000"
                className="h-12 text-center text-lg tracking-[0.4em]"
                required
              />
            </FormField>
            <Button type="submit" size="lg" loading={verifying}>
              ยืนยันและเปิดใช้
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
