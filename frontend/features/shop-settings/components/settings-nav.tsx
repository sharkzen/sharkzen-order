"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, Clock, CreditCard, Store } from "lucide-react";
import { cn } from "@/lib/cn";

const SECTIONS = [
  { id: "shop", label: "ข้อมูลร้าน", icon: Store },
  { id: "hours", label: "เวลาเปิด-ปิด", icon: Clock },
  { id: "ordering", label: "สั่งอาหารและชำระเงิน", icon: CreditCard },
  { id: "notifications", label: "การแจ้งเตือน", icon: Bell },
  { id: "staff-call", label: "เสียงเรียกพนักงาน", icon: BellRing },
];

/** เส้นอ้างอิงจากบนจอ (px) ที่หมวดต้องเลื่อนผ่านจึงนับว่าอยู่ในหมวดนั้น เผื่อแถบบนติดหน้าจอ */
const ACTIVE_OFFSET = 140;

/** เมนูหมวด: จอใหญ่ติดข้างซ้ายขณะเลื่อน จอเล็กเรียงเป็นแถวเลื่อนแนวนอน กดแล้วเลื่อนไปหมวดนั้น หมวดที่กำลังอ่านอยู่ไฮไลต์เหมือนตอน hover */
export function SettingsNav() {
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    function update() {
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) return setActive(SECTIONS[SECTIONS.length - 1].id);

      let current = SECTIONS[0].id;
      for (const { id } of SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= ACTIVE_OFFSET) current = id;
      }
      setActive(current);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <nav
      aria-label="หมวดการตั้งค่า"
      className="scroll-thin -mx-1 flex gap-1 overflow-x-auto px-1 pb-1 xl:sticky xl:top-24 xl:mx-0 xl:flex-col xl:overflow-visible xl:px-0 xl:pb-0"
    >
      {SECTIONS.map(({ id, label, icon: Icon }) => (
        <a
          key={id}
          href={`#${id}`}
          aria-current={active === id ? "location" : undefined}
          className={cn(
            "hover:bg-surface hover:text-foreground focus-visible:ring-primary/50 flex h-10 shrink-0 items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none",
            active === id ? "bg-surface text-foreground" : "text-muted-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </a>
      ))}
    </nav>
  );
}
