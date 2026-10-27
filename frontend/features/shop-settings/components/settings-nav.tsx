import { Bell, Clock, CreditCard, Store } from "lucide-react";

const SECTIONS = [
  { id: "shop", label: "ข้อมูลร้าน", icon: Store },
  { id: "hours", label: "เวลาเปิด-ปิด", icon: Clock },
  { id: "ordering", label: "สั่งอาหารและชำระเงิน", icon: CreditCard },
  { id: "notifications", label: "การแจ้งเตือน", icon: Bell },
];

/** เมนูหมวด: จอใหญ่ติดข้างซ้ายขณะเลื่อน จอเล็กเรียงเป็นแถวเลื่อนแนวนอน กดแล้วเลื่อนไปหมวดนั้น */
export function SettingsNav() {
  return (
    <nav
      aria-label="หมวดการตั้งค่า"
      className="scroll-thin -mx-1 flex gap-1 overflow-x-auto px-1 pb-1 xl:sticky xl:top-24 xl:mx-0 xl:flex-col xl:overflow-visible xl:px-0 xl:pb-0"
    >
      {SECTIONS.map(({ id, label, icon: Icon }) => (
        <a
          key={id}
          href={`#${id}`}
          className="text-muted-foreground hover:bg-surface hover:text-foreground focus-visible:ring-primary/50 flex h-10 shrink-0 items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </a>
      ))}
    </nav>
  );
}
