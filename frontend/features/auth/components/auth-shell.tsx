"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { buttonVariants } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { getAuthMode } from "../lib/auth-mode";
import { AuthShowcase } from "./auth-showcase";
import { AuthSwitch } from "./auth-switch";

/**
 * โครงหน้าเข้าสู่ระบบ/สมัครสมาชิก ใช้ header, พื้นหลังลายตาราง และการ์ดแบบเดียวกับหน้าแรก
 * อยู่ใน layout จึงไม่ถูกสร้างใหม่ตอนสลับหน้า ส่วนฟอร์มเลื่อนเข้ามาผ่าน template.tsx
 */
export function AuthShell({ children }: { children: ReactNode }) {
  const mode = getAuthMode(usePathname());

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-border bg-surface/90 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 md:h-[88px] md:px-10 xl:px-20">
          <Logo />
          <Link
            href={ROUTES.home}
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft className="size-4" aria-hidden />
            <span className="hidden sm:inline">กลับหน้าแรก</span>
          </Link>
        </div>
      </header>

      <main className="bg-background relative isolate flex flex-1 items-center overflow-hidden px-5 py-10 md:px-12 lg:px-24 lg:py-16">
        <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
        <div className="mx-auto grid w-full max-w-[1248px] items-center gap-12 lg:grid-cols-[1fr_480px] lg:gap-16">
          <AuthShowcase mode={mode} />

          <div className="border-border bg-surface shadow-float mx-auto flex w-full max-w-[480px] flex-col gap-7 rounded-xl border p-6 sm:p-9">
            <AuthSwitch mode={mode} />
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
