import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { ROUTES } from "@/constants/routes";

/** โลโก้เป็น SVG สี่เหลี่ยมจัตุรัส: 48x48 (header/footer) และ 32x32 (sidebar, ภาพจำลอง dashboard) */
export function Logo({ size = 48 }: { size?: 32 | 48 }) {
  return (
    <Link href={ROUTES.home} className="flex items-center gap-[9px]">
      <Image
        src="/images/logo.svg"
        alt=""
        width={size}
        height={size}
        unoptimized
        className="shrink-0"
      />
      <span
        className={`font-display text-foreground font-semibold tracking-wide whitespace-nowrap ${size === 48 ? "text-lg" : "text-[15px]"}`}
      >
        {siteConfig.name}
      </span>
    </Link>
  );
}
