import Link from "next/link";
import { siteConfig } from "@/config/site";
import { ROUTES } from "@/constants/routes";
import { Logo } from "./logo";

const COLUMNS = [
  {
    title: "ผลิตภัณฑ์",
    links: [
      { label: "ฟีเจอร์ทั้งหมด", href: "#features" },
      { label: "แพ็กเกจและราคา", href: "#pricing" },
      { label: "เข้าสู่ระบบร้านอาหาร", href: "/login" },
    ],
  },
  {
    title: "การช่วยเหลือ",
    links: [
      { label: "คู่มือการใช้งาน", href: "#how-it-works" },
      { label: "คำถามที่พบบ่อย", href: "#faq" },
      { label: "ติดต่อทีมดูแล", href: "#faq" },
    ],
  },
];

// "use cache" เพื่อให้ new Date() prerender ได้ภายใต้ cacheComponents
export async function SiteFooter() {
  "use cache";

  const buddhistYear = new Date().getFullYear() + 543;

  return (
    <footer className="bg-surface px-5 pt-12 pb-7 md:px-12 lg:px-24">
      <div className="mx-auto flex max-w-[1248px] flex-col gap-10">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="flex max-w-[350px] flex-col gap-4">
            <Logo />
            <p className="text-muted-foreground text-sm">
              ระบบสั่งอาหารผ่านคิวอาร์โค้ด
              ที่ช่วยให้ทุกร้านดูแลทุกมื้อได้ดีกว่าเดิม
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-3 text-sm">
              <p className="text-foreground font-semibold">{col.title}</p>
              {col.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-muted-foreground hover:text-primary-strong"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
          <div className="flex flex-col gap-3 text-sm">
            <p className="text-foreground font-semibold">พูดคุยกับเรา</p>
            <p className="text-muted-foreground">โทร. 02-123-4567</p>
            <p className="text-muted-foreground">ทุกวัน 09:00–21:00 น.</p>
            <Link href="/login" className="text-primary-strong">
              นัดชมระบบฟรี →
            </Link>
          </div>
        </div>
        <div className="border-border text-muted-foreground flex flex-col justify-between gap-2 border-t pt-6 text-xs sm:flex-row">
          <p>
            © {buddhistYear} {siteConfig.name} สงวนลิขสิทธิ์
          </p>
          <div className="flex gap-6">
            <Link href={ROUTES.privacy} className="hover:text-primary-strong">
              นโยบายความเป็นส่วนตัว
            </Link>
            <Link href={ROUTES.terms} className="hover:text-primary-strong">
              ข้อกำหนดการใช้งาน
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
