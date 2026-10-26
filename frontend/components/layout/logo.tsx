import Link from "next/link";
import { siteConfig } from "@/config/site";
import { ROUTES } from "@/constants/routes";

/** ขนาดโลโก้ที่แนะนำ: 48x48 (header/footer) และ 32x32 (ภาพจำลอง dashboard) ใช้ไฟล์ SVG หรือ PNG สี่เหลี่ยมจัตุรัส */
export function Logo({ size = 48 }: { size?: 32 | 48 }) {
  return (
    <Link href={ROUTES.home} className="flex items-center gap-[9px]">
      {/*
        พื้นที่ว่างสำหรับโลโก้ — เมื่อมีไฟล์แล้วให้แทน <span> นี้ด้วย
        <Image src="/images/logo.svg" alt="" width={size} height={size} />
      */}
      <span
        aria-hidden
        style={{ width: size, height: size }}
        className="border-border bg-muted shrink-0 rounded-lg border border-dashed"
      />
      <span
        className={`font-display text-foreground font-semibold tracking-wide whitespace-nowrap ${size === 48 ? "text-lg" : "text-[15px]"}`}
      >
        {siteConfig.name}
      </span>
    </Link>
  );
}
