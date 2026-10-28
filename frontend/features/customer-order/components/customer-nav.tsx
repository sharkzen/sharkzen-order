import Link from "next/link";
import { PiForkKnifeBold, PiForkKnifeFill, PiReceiptBold, PiReceiptFill } from "react-icons/pi";
import { cn } from "@/lib/cn";

interface CustomerNavProps {
  token: string;
  active: "menu" | "orders";
  /** จำนวนออเดอร์ที่ยังไม่เสิร์ฟ แสดงเป็นเลขบนแท็บประวัติ */
  inProgress?: number;
}

/** แถบเมนูล่างแบบลอย (สูง 64px): สั่งอาหาร / ประวัติการสั่ง แตะที่ไหนในแท็บก็กดได้ */
export function CustomerNav({ token, active, inProgress = 0 }: CustomerNavProps) {
  const tabs = [
    { id: "menu" as const, href: `/t/${token}`, label: "สั่งอาหาร", icon: PiForkKnifeBold, activeIcon: PiForkKnifeFill },
    { id: "orders" as const, href: `/t/${token}/orders`, label: "ประวัติการสั่ง", icon: PiReceiptBold, activeIcon: PiReceiptFill },
  ];

  return (
    <nav
      aria-label="เมนูหลัก"
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30"
    >
      <ul className="bg-surface border-border shadow-float mx-auto grid h-16 max-w-xl grid-cols-2 overflow-hidden rounded-2xl border">
        {tabs.map(({ id, href, label, icon, activeIcon }) => {
          const on = active === id;
          const Icon = on ? activeIcon : icon;
          return (
            <li key={id}>
              <Link
                href={href}
                replace
                aria-current={on ? "page" : undefined}
                className={cn(
                  "focus-visible:ring-primary/50 relative flex h-full flex-col items-center justify-center gap-1 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset",
                  on ? "text-primary-strong font-semibold" : "text-muted-foreground hover:text-foreground font-medium",
                )}
              >
                <span className="relative">
                  <Icon className="size-6" aria-hidden />
                  {id === "orders" && inProgress > 0 && (
                    <span className="bg-primary text-primary-foreground border-surface absolute -top-1.5 -right-2.5 flex size-[18px] items-center justify-center rounded-full border-2 text-[10px] font-semibold tabular-nums">
                      {inProgress}
                    </span>
                  )}
                </span>
                {label}
                {on && <span className="bg-primary absolute bottom-0 h-[3px] w-16 rounded-full" aria-hidden />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
