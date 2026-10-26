import { Logo } from "@/components/layout/logo";

/** โลโก้ใช้คอมโพเนนต์กลางของเว็บ (ชื่อจาก siteConfig) เพื่อให้เปลี่ยนที่เดียวเมื่อได้ไฟล์โลโก้จริง */
export function SidebarBrand() {
  return <Logo size={32} />;
}
