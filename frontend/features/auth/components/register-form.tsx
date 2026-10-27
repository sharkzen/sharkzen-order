"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Checkbox, FormField, Input } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { TRIAL_DAYS, type BillingCycle, type PlanId } from "@/features/landing/data";
import { notify } from "@/lib/toast";
import { authApi } from "../lib/auth-api";
import { OtpStep } from "./otp-step";
import { PasswordInput } from "./password-input";
import { PasswordStrengthMeter } from "./password-strength-meter";

type Field = "firstName" | "lastName" | "email" | "password" | "confirm";
type Errors = Partial<Record<Field | "terms", string>>;

function validate(values: Record<Field, string>, accepted: boolean): Errors {
  const errors: Errors = {};
  if (!values.firstName.trim()) errors.firstName = "กรอกชื่อ";
  if (!values.lastName.trim()) errors.lastName = "กรอกนามสกุล";
  if (!/^\S+@\S+\.\S+$/.test(values.email))
    errors.email = "กรอกอีเมลให้ถูกต้อง เช่น you@restaurant.com";
  if (values.password.length < 8)
    errors.password = "ตั้งรหัสผ่านอย่างน้อย 8 ตัวอักษร";
  if (values.confirm !== values.password)
    errors.confirm = "รหัสผ่านทั้งสองช่องไม่ตรงกัน";
  if (!accepted)
    errors.terms = "ต้องยอมรับข้อกำหนดและนโยบายความเป็นส่วนตัวก่อนสมัคร";
  return errors;
}

interface RegisterFormProps {
  /** แพ็กเกจที่เลือกมาจากหน้าแรก (ไม่มีช่องเลือกในหน้านี้ ส่งต่อไปหน้าเลือกแพ็กเกจหลังยืนยันอีเมล) */
  plan?: PlanId;
  billing?: BillingCycle;
}

export function RegisterForm({ plan, billing }: RegisterFormProps) {
  const router = useRouter();
  const [pendingEmail, setPendingEmail] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const read = (key: Field) => String(form.get(key) ?? "");
    const values = {
      firstName: read("firstName"),
      lastName: read("lastName"),
      email: read("email"),
      password: read("password"),
      confirm: read("confirm"),
    };

    const accepted = form.get("terms") === "on";
    const found = validate(values, accepted);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      const { data } = await authApi.register({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        password: values.password,
        acceptedTerms: true,
        marketingConsent: form.get("marketing") === "on",
        plan,
        billing: plan ? billing : undefined,
      });
      setPendingEmail(data.email);
    } catch (error) {
      notify.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (pendingEmail) {
    return (
      <OtpStep
        email={pendingEmail}
        onBack={() => setPendingEmail(undefined)}
        onVerified={() => router.push(ROUTES.onboardingPlan)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-foreground text-[26px] leading-tight font-semibold">
          สมัครสมาชิก
        </h1>
        <p className="text-muted-foreground text-sm">
          ทดลองใช้ฟรี {TRIAL_DAYS} วัน ไม่ต้องใช้บัตรเครดิต
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="ชื่อ" htmlFor="firstName" error={errors.firstName}>
            <Input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              className="h-12 text-[15px]"
              invalid={!!errors.firstName}
            />
          </FormField>
          <FormField label="นามสกุล" htmlFor="lastName" error={errors.lastName}>
            <Input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              className="h-12 text-[15px]"
              invalid={!!errors.lastName}
            />
          </FormField>
        </div>
        <FormField label="อีเมล" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@restaurant.com"
            className="h-12 text-[15px]"
            invalid={!!errors.email}
          />
        </FormField>
        <div className="flex flex-col gap-2.5">
          <FormField
            label="รหัสผ่าน"
            htmlFor="password"
            error={errors.password}
          >
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
        <FormField
          label="ยืนยันรหัสผ่าน"
          htmlFor="confirm"
          error={errors.confirm}
        >
          <PasswordInput
            showToggle={false}
            id="confirm"
            name="confirm"
            autoComplete="new-password"
            invalid={!!errors.confirm}
          />
        </FormField>

        <div className="border-border bg-muted flex flex-col gap-3.5 rounded-xl border p-4">
          <div className="flex flex-col gap-1.5">
            <Checkbox
              name="terms"
              aria-invalid={!!errors.terms || undefined}
              onChange={() =>
                setErrors((prev) => ({ ...prev, terms: undefined }))
              }
              label={
                <span className="text-[13px] leading-relaxed">
                  ข้าพเจ้ายอมรับ{" "}
                  <Link
                    href={ROUTES.terms}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-strong font-semibold underline-offset-2 hover:underline"
                  >
                    ข้อกำหนดการใช้งาน
                  </Link>{" "}
                  และรับทราบ{" "}
                  <Link
                    href={ROUTES.privacy}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-strong font-semibold underline-offset-2 hover:underline"
                  >
                    นโยบายความเป็นส่วนตัว (PDPA)
                  </Link>{" "}
                  รวมถึงยินยอมให้เก็บ ใช้
                  และประมวลผลข้อมูลส่วนบุคคลเพื่อการสมัครและให้บริการ
                </span>
              }
            />
            {errors.terms && (
              <p role="alert" className="text-danger text-xs">
                {errors.terms}
              </p>
            )}
          </div>
        </div>

        <Button type="submit" size="lg" loading={loading} className="h-[52px]">
          สร้างบัญชีและรับรหัสยืนยัน
        </Button>
      </form>
    </div>
  );
}
