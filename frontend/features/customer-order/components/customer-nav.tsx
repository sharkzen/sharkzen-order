import Link from "next/link";
import { Receipt, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/cn";

interface CustomerNavProps {
  token: string;
  active: "menu" | "orders";
  /** จำนวนออเดอร์ที่ยังไม่เสิร์ฟ แสดงเป็นเลขบนแท็บประวัติ */
  inProgress?: number;
}

/** แถบเมนูล่างสุด (สูง 64px + safe area): สั่งอาหาร / ประวัติการสั่ง แตะที่ไหนในแท็บก็กดได้ (สูงเต็ม 64px) */
export function CustomerNav({ token, active, inProgress = 0 }: CustomerNavProps) {
  const tabs = [
    { id: "menu" as const, href: `/t/${token}`, label: "สั่งอาหาร", icon: UtensilsCrossed },
    { id: "orders" as const, href: `/t/${token}/orders`, label: "ประวัติการสั่ง", icon: Receipt },
  ];

  return (
    <nav
      aria-label="เมนูหลัก"
      className="bg-surface border-border fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid h-16 max-w-xl grid-cols-2">
        {tabs.map(({ id, href, label, icon: Icon }) => {
          const on = active === id;
          return (
            <li key={id}>
              <Link
                href={href}
                replace
                aria-current={on ? "page" : undefined}
                className={cn(
                  "focus-visible:ring-primary/50 flex h-full flex-col items-center justify-center gap-1 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset",
                  on ? "text-primary-strong font-semibold" : "text-muted-foreground hover:text-foreground font-medium",
                )}
              >
                <span className="relative">
                  <Icon className="size-6" strokeWidth={on ? 2.25 : 1.75} aria-hidden />
                  {id === "orders" && inProgress > 0 && (
                    <span className="bg-primary text-primary-foreground border-surface absolute -top-1.5 -right-2.5 flex size-[18px] items-center justify-center rounded-full border-2 text-[10px] font-semibold tabular-nums">
                      {inProgress}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
