"use client";

import { useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { Card, EmptyState, Pagination } from "@/components/ui";
import { REPORT_DATE, UPDATED_AT } from "../data/orders";
import { exportOrdersCsv } from "../lib/export-csv";
import { PAGE_SIZE, countByStatus, filterOrders } from "../lib/order-utils";
import type { ManagedOrder, PaymentFilter, StatusFilter } from "../types";
import { NewOrdersBanner } from "./new-orders-banner";
import { OrderFilters } from "./order-filters";
import { OrdersPageHeader } from "./orders-page-header";
import { OrdersTable } from "./orders-table";
import { StatusTabs } from "./status-tabs";

/**
 * พื้นที่ทำงานของหน้าจัดการคำสั่งซื้อ (client เพราะมีตัวกรองและแบ่งหน้า)
 * ตัวกรองสถานะใช้ state เดียวกันทั้งแท็บและช่องเลือก เปลี่ยนตัวกรองแล้วกลับไปหน้า 1 เสมอ
 */
export function OrdersWorkspace({ orders }: { orders: ManagedOrder[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [payment, setPayment] = useState<PaymentFilter>("all");
  const [page, setPage] = useState(1);

  const counts = useMemo(() => countByStatus(orders), [orders]);
  const filtered = useMemo(
    () => filterOrders(orders, { query, status, payment }),
    [orders, query, status, payment],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  function changeStatus(value: StatusFilter) {
    setStatus(value);
    setPage(1);
  }

  function reset() {
    setQuery("");
    setStatus("all");
    setPayment("all");
    setPage(1);
  }

  return (
    <div className="flex w-full flex-col gap-5 sm:gap-6">
      <OrdersPageHeader
        onExport={() =>
          exportOrdersCsv(filtered, `คำสั่งซื้อ-${REPORT_DATE}.csv`)
        }
      />
      <NewOrdersBanner count={counts.new} onView={() => changeStatus("new")} />
      <OrderFilters
        query={query}
        status={status}
        payment={payment}
        dateLabel={REPORT_DATE}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        onStatusChange={changeStatus}
        onPaymentChange={(value) => {
          setPayment(value);
          setPage(1);
        }}
      />

      <Card className="overflow-hidden p-0">
        <StatusTabs value={status} counts={counts} onChange={changeStatus} />
        {visible.length > 0 ? (
          <>
            <OrdersTable orders={visible} />
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              from={start + 1}
              to={start + visible.length}
              total={filtered.length}
              onChange={setPage}
            />
          </>
        ) : (
          <EmptyState
            icon={<SearchX className="size-6" aria-hidden />}
            title="ไม่พบคำสั่งซื้อที่ตรงกับตัวกรอง"
            description="ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองเพื่อดูคำสั่งซื้อทั้งหมด"
            actionLabel="ล้างตัวกรอง"
            onAction={reset}
          />
        )}
      </Card>

      <p className="text-muted-foreground text-[11px]">
        อัปเดตล่าสุด {UPDATED_AT} •
        สถานะอาหารและการชำระเงินแสดงแยกกันเพื่อความถูกต้องในการปิดบิล
      </p>
    </div>
  );
}
