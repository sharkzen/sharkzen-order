import { SectionCard } from "@/features/dashboard/components/shared/section-card";
import { formatNumber } from "@/features/dashboard/lib/format";
import { ROUTES } from "@/constants/routes";
import type { TopMenu } from "@/features/reports/types";

/** เมนูทำเงินสูงสุด เรียงตามยอดขาย แท่งเทียบกับเมนูอันดับ 1 */
export function TopMenuCard({ menus }: { menus: TopMenu[] }) {
  const top = menus[0]?.revenue ?? 0;

  return (
    <SectionCard
      title="เมนูทำเงินสูงสุด"
      action={{ label: "จัดการเมนู →", href: ROUTES.menu }}
      className="min-w-0"
    >
      <ol className="flex flex-col gap-4">
        {menus.map((menu, index) => (
          <li key={menu.name} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="text-foreground min-w-0 truncate font-medium">
                <span className="text-muted-foreground mr-2 tabular-nums">
                  {index + 1}
                </span>
                {menu.name}
              </span>
              <span className="text-foreground shrink-0 font-semibold tabular-nums">
                {formatNumber(menu.revenue)} บาท
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div
                aria-hidden
                className="bg-primary-soft h-2 flex-1 overflow-hidden rounded-full"
              >
                <div
                  className="bg-primary h-full rounded-full"
                  style={{
                    width: `${top > 0 ? (menu.revenue / top) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-muted-foreground w-16 shrink-0 text-right text-[11px] tabular-nums">
                {formatNumber(menu.quantity)} จาน
              </span>
            </div>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}
