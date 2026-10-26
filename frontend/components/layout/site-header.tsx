import Link from "next/link";
import { buttonVariants } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { NAV_ITEMS } from "@/features/landing/data";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { SiteNav } from "./site-nav";

export function SiteHeader() {
  return (
    <header className="border-border bg-surface/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-[88px] max-w-[1440px] items-center justify-between px-5 md:px-10 xl:px-20">
        <Logo />
        <SiteNav items={NAV_ITEMS} />
        <div className="flex items-center gap-3">
          <Link
            href={ROUTES.login}
            className={buttonVariants({
              variant: "outline",
              className: "hidden sm:inline-flex",
            })}
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            href={ROUTES.register}
            className={buttonVariants({ className: "hidden sm:inline-flex" })}
          >
            สมัครสมาชิก
          </Link>
          <MobileNav items={NAV_ITEMS} />
        </div>
      </div>
    </header>
  );
}
