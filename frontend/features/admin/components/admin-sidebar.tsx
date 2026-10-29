"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { ROUTES } from "@/constants/routes";
import { clientHttp } from "@/lib/http/client";
import { cn } from "@/lib/cn";
import { notify } from "@/lib/toast";
import { useAdminUser } from "./admin-shell";
import { ADMIN_NAV, isActiveNav } from "./admin-nav";

/** แถบนำทางผู้ดูแลระบบ ใช้ทั้งแถบถาวรบนจอใหญ่และ drawer บนมือถือ */
export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAdminUser();
  const [leaving, setLeaving] = useState(false);

  async function logout() {
    setLeaving(true);
    try {
      await clientHttp.post("/auth/logout");
      router.replace(ROUTES.login);
    } catch (e) {
      notify.error(e);
      setLeaving(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col gap-7 px-4 py-6">
      <div className="flex flex-col gap-3">
        <Logo size={32} />
        <span className="bg-primary-soft text-primary-strong inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold">
          <ShieldCheck className="size-3.5" aria-hidden />
          พื้นที่ผู้ดูแลระบบ
        </span>
      </div>

      <nav aria-label="เมนูผู้ดูแลระบบ" className="flex flex-col gap-1.5">
        <p className="text-muted-foreground text-[11px]">การจัดการระบบ</p>
        {ADMIN_NAV.map(({ label, href, icon: Icon }) => {
          const active = isActiveNav(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "focus-visible:ring-primary/50 flex h-[46px] items-center gap-[11px] rounded-lg px-3 text-[13px] transition-colors focus-visible:ring-2 focus-visible:outline-none",
                active
                  ? "bg-primary-soft text-primary-strong font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-[19px] shrink-0" aria-hidden />
              <span className="flex-1">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-border mt-auto flex flex-col gap-3 rounded-xl border p-3">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="bg-primary-soft text-primary-strong flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          >
            {user.firstName.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <p className="text-foreground truncate text-[13px] font-semibold">
              {`${user.firstName} ${user.lastName}`.trim()}
            </p>
            <p className="text-muted-foreground truncate text-[11px]">{user.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          disabled={leaving}
          className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-primary/50 flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
        >
          <LogOut className="size-4" aria-hidden />
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
}
