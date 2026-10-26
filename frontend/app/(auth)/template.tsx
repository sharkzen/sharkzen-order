"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { m } from "framer-motion";
import { getAuthMode, type AuthMode } from "@/features/auth/lib/auth-mode";

// จำโหมดก่อนหน้าไว้หาทิศทางการเลื่อน (อ่านเฉพาะฝั่ง client เพื่อไม่ให้ SSR ไม่ตรงกัน)
let previousMode: AuthMode | null = null;

/** template สร้างใหม่ทุกครั้งที่สลับหน้า: login → register เลื่อนเข้าจากขวา, กลับกันเข้าจากซ้าย */
export default function AuthTemplate({ children }: { children: ReactNode }) {
  const mode = getAuthMode(usePathname());
  const from = typeof window === "undefined" ? null : previousMode;
  const offset =
    from === null || from === mode ? 0 : mode === "register" ? 20 : -20;

  useEffect(() => {
    previousMode = mode;
  }, [mode]);

  return (
    <m.div
      initial={{ opacity: 0, x: offset, y: offset === 0 ? 10 : 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}
