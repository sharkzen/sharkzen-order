import Link from "next/link";
import { ChefHat, Plus, QrCode } from "lucide-react";
import { buttonVariants } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { SectionCard } from "../shared/section-card";

const ACTIONS = [
  { label: "เพิ่มเมนูอาหาร", href: ROUTES.menu, icon: Plus, primary: true },
  { label: "คิวอาร์โค้ดโต๊ะ", href: ROUTES.tables, icon: QrCode },
  { label: "เปิดหน้าจอครัว", href: ROUTES.kitchen, icon: ChefHat },
] as const;

export function QuickActionsCard() {
  return (
    <SectionCard title="จัดการได้ทันที">
      <div className="flex flex-col gap-2.5">
        {ACTIONS.map(({ label, href, icon: Icon, ...rest }) => (
          <Link
            key={href}
            href={href}
            className={buttonVariants({
              variant: "primary" in rest ? "primary" : "outline",
            })}
          >
            <Icon className="size-[18px]" aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}
