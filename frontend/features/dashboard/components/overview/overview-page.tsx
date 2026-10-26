import {
  METRICS,
  ORDER_STATUSES,
  POPULAR_MENUS,
  RECENT_ORDERS,
  REPORT_DATE,
  REVENUE,
  SHOP,
  UPDATED_AT,
  ACCOUNT,
} from "../../data/overview";
import { DataFreshness } from "./data-freshness";
import { MetricsGrid } from "./metrics-grid";
import { OrderStatusCard } from "./order-status-card";
import { PageHeader } from "./page-header";
import { PopularMenuCard } from "./popular-menu-card";
import { QuickActionsCard } from "./quick-actions-card";
import { RecentOrdersCard } from "./recent-orders-card";
import { RevenueChartCard } from "./revenue-chart-card";
import { ShopInfoCard } from "./shop-info-card";

/** หน้าภาพรวมร้านอาหารของเจ้าของร้าน รวมทุกส่วนตามลำดับความสำคัญ: ตัวเลข → รายได้/สถานะ → เมนู/คำสั่งซื้อ */
export function OverviewPage() {
  return (
    <div className="flex w-full flex-col gap-5 sm:gap-6">
      <PageHeader
        title="ภาพรวมร้านอาหาร"
        description={`ยินดีต้อนรับกลับมา คุณ${ACCOUNT.name} • มาดูความเคลื่อนไหววันนี้กัน`}
        dateLabel={REPORT_DATE}
      />
      <MetricsGrid metrics={METRICS} />

      <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)_minmax(240px,0.8fr)]">
        <div className="md:col-span-2 xl:col-span-1">
          <RevenueChartCard revenue={REVENUE} />
        </div>
        <OrderStatusCard statuses={ORDER_STATUSES} />
        <div className="flex flex-col gap-5">
          <QuickActionsCard />
          <ShopInfoCard shop={SHOP} />
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <PopularMenuCard menus={POPULAR_MENUS} />
        <RecentOrdersCard orders={RECENT_ORDERS} />
      </div>

      <DataFreshness updatedAt={UPDATED_AT} reportDate={REPORT_DATE} />
    </div>
  );
}
