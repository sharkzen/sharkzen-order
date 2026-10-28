import { NextResponse, type NextRequest } from "next/server";
import { ROUTES } from "@/constants/routes";

/** ชื่อ cookie เดียวกับที่ backend ตั้งตอนเข้าสู่ระบบ (auth.controller.ts) */
const SESSION_COOKIE = "sz_session";

/**
 * เข้าสู่ระบบแล้วจะเปิด /login /register ไม่ได้ — เด้งกลับหน้าที่กดมา
 * (ดูจาก Referer ของ origin เดียวกัน) ถ้าไม่มีให้ไปแดชบอร์ด
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const from = new URL(referer);
      const isAuthPage = [ROUTES.login, ROUTES.register].includes(from.pathname as never);
      if (from.origin === request.nextUrl.origin && !isAuthPage) {
        return NextResponse.redirect(new URL(from.pathname + from.search, request.url));
      }
    } catch {
      // referer ผิดรูปแบบ → ใช้ค่าเริ่มต้น
    }
  }
  return NextResponse.redirect(new URL(ROUTES.dashboard, request.url));
}

export const config = {
  matcher: ["/login", "/register"],
};
