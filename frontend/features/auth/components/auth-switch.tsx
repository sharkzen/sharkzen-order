import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/cn";
import type { AuthMode } from "@/features/auth/lib/auth-mode";

const TABS = [
  { mode: "login", href: ROUTES.login, label: "เข้าสู่ระบบ" },
  { mode: "register", href: ROUTES.register, label: "สมัครสมาชิก" },
] as const;

/** สวิตช์ทรงแคปซูลแบบเดียวกับปุ่มขั้นตอนใน Hero ตัวพื้นสีน้ำเงินเลื่อนไปหาแท็บที่เลือก */
export function AuthSwitch({ mode }: { mode: AuthMode }) {
  return (
    <nav
      aria-label="เข้าสู่ระบบหรือสมัครสมาชิก"
      className="border-border bg-background relative grid grid-cols-2 rounded-full border p-1"
    >
      <span
        aria-hidden
        className={cn(
          "bg-primary absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          mode === "register" && "translate-x-full",
        )}
      />
      {TABS.map((tab) => (
        <Link
          key={tab.mode}
          href={tab.href}
          aria-current={tab.mode === mode ? "page" : undefined}
          className={cn(
            "focus-visible:ring-primary/50 relative z-10 flex h-10 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-300 focus-visible:ring-2 focus-visible:outline-none",
            tab.mode === mode
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
