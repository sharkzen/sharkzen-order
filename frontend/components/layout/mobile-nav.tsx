"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, m } from "framer-motion";
import { Menu, X } from "lucide-react";
import { buttonVariants } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import type { NavItem } from "@/features/landing/data";
import { useActiveSection } from "@/hooks/use-active-section";
import { cn } from "@/lib/cn";

/** เมนูสำหรับจอเล็ก (ต่ำกว่า lg) เปิด/ปิดจากปุ่มแฮมเบอร์เกอร์ใน header */
export function MobileNav({ items }: { items: NavItem[] }) {
  const active = useActiveSection(items.map((item) => item.id));
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
        className="border-border bg-surface hover:bg-muted focus-visible:ring-primary/50 flex size-[46px] cursor-pointer items-center justify-center rounded-lg border focus-visible:ring-2 focus-visible:outline-none"
      >
        {open ? (
          <X className="size-5" aria-hidden />
        ) : (
          <Menu className="size-5" aria-hidden />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <m.nav
            id="mobile-menu"
            aria-label="เมนูหลัก"
            className="border-border bg-surface shadow-card absolute inset-x-0 top-full flex flex-col gap-1 border-b px-5 py-4"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={close}
                aria-current={item.id === active ? "location" : undefined}
                className={cn(
                  "rounded-lg px-3 py-3 text-base",
                  item.id === active
                    ? "bg-primary-soft text-primary-strong font-semibold"
                    : "text-foreground hover:bg-muted",
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={ROUTES.login}
              onClick={close}
              className={buttonVariants({
                variant: "outline",
                className: "mt-2 sm:hidden",
              })}
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href={ROUTES.register}
              onClick={close}
              className={buttonVariants({ className: "sm:hidden" })}
            >
              สมัครสมาชิก
            </Link>
          </m.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
