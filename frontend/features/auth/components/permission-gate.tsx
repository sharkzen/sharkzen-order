"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { buttonVariants } from "@/components/ui";
import { SIDEBAR_NAV } from "@/features/dashboard/data/navigation";
import { useShop } from "@/features/shop/components/shop-provider";
import { canAccess, homeFor } from "@/features/auth/lib/access";

/** กันพนักงานที่ไม่มีสิทธิ์เปิดหน้านั้นตรงๆ ผ่าน URL (ตัวบังคับจริงอยู่ที่ backend ทุก API) */
export function PermissionGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useShop();
  const page = SIDEBAR_NAV.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  if (user && page && !canAccess(user, page)) {
    const home = homeFor(user);
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
        <span className="bg-warning-soft text-warning-strong flex size-14 items-center justify-center rounded-full">
          <Lock className="size-7" aria-hidden />
        </span>
        <h1 className="font-display text-foreground text-2xl font-semibold">คุณไม่มีสิทธิ์เข้าหน้านี้</h1>
        <p className="text-muted-foreground text-sm">บทบาทของบัญชีนี้ยังไม่ได้รับสิทธิ์ใช้งานหน้านี้ หากต้องใช้ ให้ขอเจ้าของร้านหรือผู้จัดการเพิ่มสิทธิ์ให้</p>
        {home !== pathname && (
          <Link href={home} className={buttonVariants({})}>
            ไปหน้าที่ใช้งานได้
          </Link>
        )}
      </div>
    );
  }
  return children;
}
