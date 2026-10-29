"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Skeleton } from "@/components/ui";
import { useShop } from "@/features/shop/components/shop-provider";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { SocketEvent } from "@/lib/socket";
import { cn } from "@/lib/cn";
import { toApiError } from "@/lib/http/api-error";
import { dashboardApi, type OverviewResponse } from "@/features/dashboard/lib/dashboard-api";
import {
  formatRange,
  presetRange,
  type RangePreset,
} from "@/features/dashboard/lib/date-range";
import {
  toMetrics,
  toPopular,
  toRecent,
  toRevenue,
  toStatuses,
} from "@/features/dashboard/lib/overview-view";
import {
  DashboardFilters,
  type DashboardFilterState,
} from "./dashboard-filters";
import { DataFreshness } from "./data-freshness";
import { MetricsGrid } from "./metrics-grid";
import { OrderStatusCard } from "./order-status-card";
import { PageHeader } from "./page-header";
import { PopularMenuCard } from "./popular-menu-card";
import { QuickActionsCard } from "./quick-actions-card";
import { RecentOrdersCard } from "./recent-orders-card";
import { RevenueChartCard } from "./revenue-chart-card";
import { ShopInfoCard } from "./shop-info-card";

/** ข้อมูลตัวอย่างให้ skeleton เรนเดอร์หน้าจริงทั้งหน้าก่อนข้อมูลมาถึง */
const PLACEHOLDER: OverviewResponse = {
  range: { from: "2000-01-01", to: "2000-01-01", days: 1, granularity: "hour" },
  generatedAt: "2000-01-01T00:00:00.000Z",
  summary: { revenue: 0, orders: 0, paidOrders: 0, averageOrder: 0 },
  previous: { revenue: 0, orders: 0, paidOrders: 0, averageOrder: 0 },
  tables: { occupied: 0, total: 0 },
  series: Array.from({ length: 24 }, (_, h) => ({ key: String(h).padStart(2, "0"), amount: 100 + ((h * 37) % 9) * 40 })),
  statuses: (["NEW", "PREPARING", "READY", "SERVED", "CANCELLED"] as const).map((status) => ({ status, count: 1 })),
  // key ของรายการมาจากชื่อเมนูและเลขออเดอร์ ข้อมูลตัวอย่างจึงต้องไม่ซ้ำกัน
  popular: Array.from({ length: 5 }, (_, index) => ({ name: `เมนูอาหารตัวอย่าง${"​".repeat(index)}`, quantity: 1, revenue: 100, image: "" })),
  recent: Array.from({ length: 6 }, (_, index) => ({
    id: `p${index}`,
    code: `SZ-000000-PLACEH${index}`,
    createdAt: "2000-01-01T00:00:00.000Z",
    table: "โต๊ะ 0",
    total: 100,
    status: "NEW" as const,
  })),
};

const INITIAL_FILTERS: DashboardFilterState = {
  preset: "today",
  customMode: "day",
  status: "",
  payment: "",
  ...presetRange("today"),
};

/** ชื่อช่วงเวลาที่ใช้ต่อท้ายหัวข้อการ์ด เช่น "รายได้วันนี้" */
const PERIOD_LABEL: Record<RangePreset, string> = {
  today: "วันนี้",
  yesterday: "เมื่อวาน",
  week: "7 วันล่าสุด",
  month: "เดือนนี้",
  custom: "ช่วงที่เลือก",
};

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  timeZone: "Asia/Bangkok",
  hour: "2-digit",
  minute: "2-digit",
};

/** หน้าภาพรวมร้านอาหารของเจ้าของร้าน ดึงข้อมูลจริงจาก backend ตามช่วงเวลาและตัวกรองที่เลือก */
export function OverviewPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [data, setData] = useState<OverviewResponse>();
  const [settled, setSettled] = useState<{ key: string; error?: string }>();
  const [reloadKey, setReloadKey] = useState(0);
  // เพิ่มทุกครั้งที่มีออเดอร์เปลี่ยนผ่าน socket เพื่อโหลดตัวเลขใหม่แบบเงียบ ไม่กะพริบ
  const [liveVersion, setLiveVersion] = useState(0);
  const { user } = useShop();
  const firstName = user?.firstName;

  const { from, to, status, payment } = filters;
  // กำลังโหลดเมื่อผลล่าสุดที่ได้ยังไม่ตรงกับตัวกรองปัจจุบัน
  const requestKey = `${from}|${to}|${status}|${payment}|${reloadKey}`;
  const loading = settled?.key !== requestKey;
  const error = loading ? undefined : settled?.error;

  useEffect(() => {
    const controller = new AbortController();
    dashboardApi
      .overview(
        {
          from,
          to,
          status: status || undefined,
          payment: payment || undefined,
        },
        controller.signal,
      )
      .then(({ data }) => {
        setData(data);
        setSettled({ key: requestKey });
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setSettled({ key: requestKey, error: toApiError(e).message });
      });
    return () => controller.abort();
  }, [from, to, status, payment, requestKey, liveVersion]);

  useSocketEvent([SocketEvent.OrderCreated, SocketEvent.OrderUpdated], () =>
    setLiveVersion((version) => version + 1),
  );

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);

  const periodLabel = PERIOD_LABEL[filters.preset];
  const showSkeleton = !data && !error;
  const view = useMemo(() => {
    const source = data ?? PLACEHOLDER;
    const updatedAt = `${new Date(source.generatedAt).toLocaleTimeString("th-TH", TIME_FORMAT)} น.`;
    return {
      updatedAt,
      metrics: toMetrics(source, periodLabel),
      revenue: toRevenue(source, updatedAt),
      statuses: toStatuses(source),
      popular: toPopular(source),
      recent: toRecent(source),
    };
  }, [data, periodLabel]);

  const rangeLabel = formatRange(filters);

  return (
    <div className="flex w-full flex-col gap-5 sm:gap-6">
      <PageHeader
        title="ภาพรวมร้านอาหาร"
        description={`ยินดีต้อนรับกลับมา${firstName ? ` คุณ${firstName}` : ""} • ดูความเคลื่อนไหวของร้านตามช่วงเวลาที่เลือก`}
        dateLabel={rangeLabel}
      />
      <DashboardFilters value={filters} onChange={setFilters} />

      {error && (
        <Card
          role="alert"
          className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-danger text-sm">โหลดข้อมูลไม่สำเร็จ: {error}</p>
          <Button variant="outline" onClick={retry}>
            ลองใหม่
          </Button>
        </Card>
      )}

      {(data || showSkeleton) && (
        <Wrapper skeleton={showSkeleton}>
        <div
          aria-busy={loading}
          className={cn(
            "flex flex-col gap-5 transition-opacity sm:gap-6",
            data && loading && "pointer-events-none opacity-50",
          )}
        >
          <MetricsGrid metrics={view.metrics} />

          <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)_minmax(240px,0.8fr)]">
            <div className="md:col-span-2 xl:col-span-1">
              <RevenueChartCard
                revenue={view.revenue}
                periodLabel={periodLabel}
              />
            </div>
            <OrderStatusCard statuses={view.statuses} />
            <div className="flex flex-col gap-5">
              <QuickActionsCard />
              <ShopInfoCard />
            </div>
          </div>

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <PopularMenuCard menus={view.popular} periodLabel={periodLabel} />
            <RecentOrdersCard orders={view.recent} />
          </div>

          <DataFreshness updatedAt={view.updatedAt} reportDate={rangeLabel} />
        </div>
              </Wrapper>
      )}
    </div>
  );
}

function Wrapper({ skeleton, children }: { skeleton: boolean; children: React.ReactNode }) {
  return skeleton ? <Skeleton>{children}</Skeleton> : <>{children}</>;
}
