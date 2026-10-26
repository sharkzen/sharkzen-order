import {
  ChartNoAxesCombined,
  ChefHat,
  LayoutDashboard,
  QrCode,
  ReceiptText,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/cn";
import { DEMO_RESTAURANT } from "../../data";

const ITEMS: { icon: LucideIcon; label: string; active?: boolean }[] = [
  { icon: LayoutDashboard, label: "ภาพรวมร้านอาหาร", active: true },
  { icon: ReceiptText, label: "คำสั่งซื้อและบิล" },
  { icon: Utensils, label: "เมนูอาหาร" },
  { icon: QrCode, label: "โต๊ะและคิวอาร์โค้ด" },
  { icon: ChefHat, label: "หน้าจอครัว" },
  { icon: ChartNoAxesCombined, label: "รายงานยอดขาย" },
];

export function DashboardSidebar() {
  return (
    <aside className="border-border bg-surface hidden w-[200px] shrink-0 flex-col gap-5 border-r p-4 lg:flex">
      <Logo size={32} />
      <div className="flex flex-col gap-0.5">
        <p className="text-foreground text-[13px] font-semibold">
          {DEMO_RESTAURANT.name}
        </p>
        <p className="text-muted-foreground text-[11px]">
          {DEMO_RESTAURANT.branch}
        </p>
      </div>
      <nav className="flex flex-col gap-1" aria-label="เมนูตัวอย่าง">
        {ITEMS.map(({ icon: Icon, label, active }) => (
          <span
            key={label}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[11px]",
              active
                ? "bg-primary-soft text-primary-strong font-semibold"
                : "text-muted-foreground",
            )}
          >
            <Icon
              className={cn("size-4", active && "text-primary")}
              aria-hidden
            />
            {label}
          </span>
        ))}
      </nav>
    </aside>
  );
}
