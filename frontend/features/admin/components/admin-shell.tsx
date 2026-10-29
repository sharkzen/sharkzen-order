"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { authApi, type SessionUser } from "@/features/auth/lib/auth-api";
import { ApiError } from "@/lib/http/api-error";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";
import { TotpSetup } from "./totp-setup";

const AdminContext = createContext<SessionUser | null>(null);

export function useAdminUser() {
  const user = useContext(AdminContext);
  if (!user) throw new Error("useAdminUser ต้องใช้ภายใน AdminShell");
  return user;
}

/**
 * โครงพื้นที่ผู้ดูแลระบบ: ตรวจสิทธิ์ก่อนแสดงเนื้อหา (ไม่ได้ล็อกอิน → หน้าเข้าสู่ระบบ, ไม่ใช่ผู้ดูแล → แดชบอร์ดร้าน)
 * การตรวจจริงอยู่ที่ backend ทุกเส้น ที่นี่แค่กันไม่ให้เห็นหน้าจอที่ใช้งานไม่ได้
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser>();

  useEffect(() => {
    authApi.me().then(
      ({ data }) => {
        if (data.user.role === "ADMIN") setUser(data.user);
        else router.replace(ROUTES.dashboard);
      },
      (e: unknown) => {
        if (e instanceof ApiError && e.status === 401) router.replace(ROUTES.login);
      },
    );
  }, [router]);

  if (!user) return <PageLoader />;
  // ระบบบังคับ 2FA แต่ยังไม่ได้ตั้ง: ตั้งให้เสร็จก่อนจึงเห็นหน้าผู้ดูแลระบบ
  if (user.totpRequired && !user.totpEnabled) return <TotpSetup onDone={setUser} />;

  return (
    <AdminContext.Provider value={user}>
      <div className="bg-background flex flex-1">
        <aside className="border-border bg-surface scroll-thin sticky top-0 hidden h-screen w-[248px] shrink-0 overflow-y-auto border-r lg:block">
          <AdminSidebar />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar sidebar={<AdminSidebar />} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 2xl:p-10">
            <div className="flex w-full min-w-0 flex-col gap-5 sm:gap-6">{children}</div>
          </main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
