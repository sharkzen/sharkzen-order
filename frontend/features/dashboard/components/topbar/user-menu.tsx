"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { clientHttp } from "@/lib/http/client";
import { notify } from "@/lib/toast";
import { useShop } from "@/features/shop/components/shop-provider";

/** ชื่อผู้ใช้จริงจากบัญชีที่ล็อกอิน พร้อมเมนูตั้งค่าและออกจากระบบ */
export function UserMenu() {
  const router = useRouter();
  const { user } = useShop();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const name = user ? `${user.firstName} ${user.lastName}`.trim() : "";

  async function logout() {
    try {
      await clientHttp.post("/auth/logout");
      router.replace(ROUTES.login);
    } catch (e) {
      notify.error(e);
    }
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="hover:bg-muted focus-visible:ring-primary/50 flex cursor-pointer items-center gap-2.5 rounded-lg p-1 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <span
          aria-hidden
          className="bg-primary-soft text-primary-strong flex size-9 items-center justify-center rounded-full text-sm font-bold"
        >
          {user ? user.firstName.slice(0, 1) : ""}
        </span>
        <span className="hidden flex-col leading-[1.6] md:flex">
          <span className="text-foreground text-[13px] font-semibold">{name || " "}</span>
          <span className="text-muted-foreground text-[11px]">เจ้าของร้าน</span>
        </span>
        <ChevronDown className="text-muted-foreground hidden size-3.5 md:block" aria-hidden />
        <span className="sr-only">เมนูบัญชี {name}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="border-border bg-surface shadow-float absolute top-full right-0 z-40 mt-2 w-60 overflow-hidden rounded-xl border py-1.5"
        >
          <div className="border-border border-b px-4 py-2.5">
            <p className="text-foreground text-[13px] font-semibold">{name}</p>
            <p className="text-muted-foreground truncate text-xs">{user?.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              router.push(ROUTES.settings);
            }}
            className="text-foreground hover:bg-muted flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors"
          >
            <Settings className="text-muted-foreground size-4" aria-hidden />
            ตั้งค่าร้าน
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className="text-danger-strong hover:bg-danger-soft flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors"
          >
            <LogOut className="size-4" aria-hidden />
            ออกจากระบบ
          </button>
        </div>
      )}
    </div>
  );
}
