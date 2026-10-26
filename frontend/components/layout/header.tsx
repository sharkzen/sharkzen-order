import Link from "next/link";
import { siteConfig } from "@/config/site";
import { ROUTES } from "@/constants/routes";
import { Container } from "./container";

const NAV = [
  { href: ROUTES.home, label: "หน้าแรก" },
  { href: ROUTES.orders, label: "คำสั่งซื้อ" },
];

export function Header() {
  return (
    <header className="border-border bg-surface/80 sticky top-0 z-40 border-b backdrop-blur">
      <Container className="flex h-14 items-center justify-between">
        <Link href={ROUTES.home} className="font-bold">
          {siteConfig.name}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
          <Link href={ROUTES.login} className="hover:text-primary">
            เข้าสู่ระบบ
          </Link>
        </nav>
      </Container>
    </header>
  );
}
