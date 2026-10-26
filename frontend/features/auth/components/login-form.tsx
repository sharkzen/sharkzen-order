"use client";

import { useState, type FormEvent } from "react";
import { Button, Checkbox, FormField, Input } from "@/components/ui";
import { clientHttp } from "@/lib/http/client";
import { notify } from "@/lib/toast";
import { PasswordInput } from "./password-input";

export function LoginForm() {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    try {
      await clientHttp.post("/auth/login", {
        email: form.get("email"),
        password: form.get("password"),
        remember: form.get("remember") === "on",
      });
      notify.success("เข้าสู่ระบบสำเร็จ");
    } catch (error) {
      notify.error(error);
    } finally {
      setLoading(false);
    }
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
        <Checkbox name="remember" label="จดจำฉันไว้ในอุปกรณ์นี้" />
        <Button type="submit" size="lg" loading={loading} className="h-[52px]">
          เข้าสู่ระบบ
        </Button>
      </form>
    </div>
  );
}
