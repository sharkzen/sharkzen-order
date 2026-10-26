import Image from "next/image";
import { ROUTES } from "@/constants/routes";
import { formatBaht } from "../../lib/format";
import type { PopularMenu } from "../../types";
import { SectionCard } from "../shared/section-card";

/** เมนูขายดีวันนี้ เรียงตามลำดับที่ส่งมา (ลำดับตามจำนวนจานที่ขายได้) */
export function PopularMenuCard({ menus }: { menus: PopularMenu[] }) {
  return (
    <SectionCard
      title="เมนูยอดนิยมวันนี้"
      action={{ label: "ดูทั้งหมด →", href: ROUTES.menu }}
    >
      <ol className="flex flex-col gap-4">
        {menus.map((menu, index) => (
          <li key={menu.name} className="flex items-center gap-3">
            <span className="text-muted-foreground w-3 text-xs">
              {index + 1}
            </span>
            <Image
              src={menu.image}
              alt=""
              width={48}
              height={48}
              className="size-12 shrink-0 rounded-lg object-cover"
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="text-foreground truncate text-[13px] font-medium">
                {menu.name}
              </p>
              <p className="text-muted-foreground text-[11px]">
                {menu.quantity} จาน
              </p>
            </div>
            <p className="text-foreground text-[13px] font-semibold whitespace-nowrap">
              {formatBaht(menu.revenue)}
            </p>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}
