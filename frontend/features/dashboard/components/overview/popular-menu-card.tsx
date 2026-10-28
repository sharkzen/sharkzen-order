import { ROUTES } from "@/constants/routes";
import { formatBaht } from "@/features/dashboard/lib/format";
import type { PopularMenu } from "@/features/dashboard/types";
import { SectionCard } from "@/features/dashboard/components/shared/section-card";

/** เมนูขายดีในช่วงที่เลือก เรียงตามลำดับที่ส่งมา (ลำดับตามจำนวนจานที่ขายได้) */
export function PopularMenuCard({
  menus,
  periodLabel,
}: {
  menus: PopularMenu[];
  periodLabel: string;
}) {
  return (
    <SectionCard
      title={`เมนูยอดนิยม${periodLabel}`}
      action={{ label: "ดูทั้งหมด →", href: ROUTES.menu }}
    >
      {menus.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-xs">
          ยังไม่มียอดขายในช่วงนี้
        </p>
      ) : (
        <ol className="flex flex-col gap-4">
          {menus.map((menu, index) => (
            <li key={menu.name} className="flex items-center gap-3">
              <span className="text-muted-foreground w-3 text-xs">
                {index + 1}
              </span>
              <span
                aria-hidden
                className="bg-primary-muted text-primary-strong flex size-12 shrink-0 items-center justify-center rounded-lg text-base font-semibold"
              >
                {menu.name.charAt(0)}
              </span>
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
      )}
    </SectionCard>
  );
}
