"use client";

import { useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { Button, Card, EmptyState, Pagination, Skeleton } from "@/components/ui";
import { formatRange, todayBangkok } from "@/features/dashboard/lib/date-range";
import { exportOrdersCsv } from "@/features/order-management/lib/export-csv";
import { ordersApi } from "@/features/order-management/lib/orders-api";
import { PAGE_SIZE, countByStatus, filterOrders } from "@/features/order-management/lib/order-utils";
import type {
  FoodStatus,
  ManagedOrder,
  PaymentFilter,
  StatusFilter,
} from "@/features/order-management/types";
import { useResource } from "@/hooks/use-resource";
import { SocketEvent } from "@/lib/socket";
import { notify } from "@/lib/toast";
import { NewOrdersBanner } from "./new-orders-banner";
import { OrderDetailDialog } from "./order-detail-dialog";
import { OrderFilters } from "./order-filters";
import { OrdersPageHeader } from "./orders-page-header";
import { OrdersTable } from "./orders-table";
import { StatusTabs } from "./status-tabs";

interface OrdersViewProps {
  orders: ManagedOrder[];
  date: string;
  onDateChange: (date: string) => void;
  updatedAt: string;
  onAdvance: (order: ManagedOrder, to: Exclude<FoodStatus, "cancelled">) => Promise<void>;
  onCancel: (order: ManagedOrder, reason: string) => Promise<void>;
}

const PLACEHOLDER: ManagedOrder[] = Array.from({ length: 6 }, (_, index) => ({
  id: `p${index}`,
  code: "#0000",
  time: "00:00",
  table: "โต๊ะ 0",
  items: [{ id: "i", name: "รายการอาหารตัวอย่าง", price: 100, quantity: 1, options: [],
      note: "",
      cancelledQty: 0, cancelReason: null }],
  total: 100,
  notes: [],
  cancelReason: null,
  paymentStatus: "unpaid",
  paymentMethod: "counter",
  status: "new",
}));

/**
 * หน้าจัดการคำสั่งซื้อของวันที่เลือก (ค่าเริ่มต้น = วันนี้)
 * ตัวกรองสถานะใช้ state เดียวกันทั้งแท็บและช่องเลือก เปลี่ยนตัวกรองแล้วกลับไปหน้า 1 เสมอ
 */
function OrdersView({ orders, date, onDateChange, updatedAt, onAdvance, onCancel }: OrdersViewProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [payment, setPayment] = useState<PaymentFilter>("all");
  const [page, setPage] = useState(1);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const counts = useMemo(() => countByStatus(orders), [orders]);
  const filtered = useMemo(
    () => filterOrders(orders, { query, status, payment }),
    [orders, query, status, payment],
  );
  // เปิดดูจาก id เพื่อให้รายละเอียดอัปเดตตามเมื่อสถานะเปลี่ยนจากหน้าอื่น
  const viewing = orders.find((order) => order.id === viewingId) ?? null;

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);
  const dateLabel = formatRange({ from: date, to: date });

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
      <OrdersPageHeader onExport={() => exportOrdersCsv(filtered, `คำสั่งซื้อ-${date}.csv`)} />
      <NewOrdersBanner count={counts.new} onView={() => changeStatus("new")} />
      <OrderFilters
        query={query}
        status={status}
        payment={payment}
        date={date}
        maxDate={todayBangkok()}
        onDateChange={(value) => {
          onDateChange(value);
          setPage(1);
        }}
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
            <OrdersTable orders={visible} onView={(order) => setViewingId(order.id)} />
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
            title={orders.length === 0 ? `ยังไม่มีคำสั่งซื้อ ${dateLabel}` : "ไม่พบคำสั่งซื้อที่ตรงกับตัวกรอง"}
            description={
              orders.length === 0
                ? "ออเดอร์ใหม่จากลูกค้าจะปรากฏที่นี่ทันที"
                : "ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองเพื่อดูคำสั่งซื้อทั้งหมด"
            }
            actionLabel={orders.length === 0 ? undefined : "ล้างตัวกรอง"}
            onAction={reset}
          />
        )}
      </Card>

      <p className="text-muted-foreground text-[11px]">
        อัปเดตล่าสุด {updatedAt} • หน้านี้อัปเดตเองทันทีเมื่อมีออเดอร์ใหม่หรือสถานะเปลี่ยน
        สถานะอาหารและการชำระเงินแสดงแยกกันเพื่อความถูกต้องในการปิดบิล
      </p>

      <OrderDetailDialog
        order={viewing}
        onClose={() => setViewingId(null)}
        onAdvance={onAdvance}
        onCancel={async (order, reason) => {
          await onCancel(order, reason);
          setViewingId(null);
        }}
      />
    </div>
  );
}

const TIME_FORMAT: Intl.DateTimeFormatOptions = { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit" };

export function OrdersWorkspace() {
  const [date, setDate] = useState(todayBangkok);
  const { data, setData, error, reload } = useResource((signal) => ordersApi.list(date, signal), {
    key: date,
    refetchOn: [SocketEvent.OrderCreated, SocketEvent.OrderUpdated],
  });
  const [updatedAt, setUpdatedAt] = useState(() => new Date());

  // เวลาอัปเดตล่าสุดเปลี่ยนตามข้อมูลที่เข้ามาจริง
  const [lastData, setLastData] = useState(data);
  if (data !== lastData) {
    setLastData(data);
    setUpdatedAt(new Date());
  }

  const replace = (next: ManagedOrder) =>
    setData((current) => current?.map((order) => (order.id === next.id ? next : order)));

  async function onAdvance(order: ManagedOrder, to: Exclude<FoodStatus, "cancelled">) {
    try {
      replace(await ordersApi.setStatus(order.id, to));
    } catch (e) {
      notify.error(e);
    }
  }

  async function onCancel(order: ManagedOrder, reason: string) {
    try {
      replace(await ordersApi.cancel(order.id, reason));
      notify.success(`ยกเลิกออเดอร์ ${order.code} แล้ว`);
    } catch (e) {
      notify.error(e);
      throw e;
    }
  }

  if (!data) {
    if (error) {
      return (
        <Card role="alert" className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-danger text-sm">โหลดคำสั่งซื้อไม่สำเร็จ: {error}</p>
          <Button variant="outline" onClick={reload}>
            ลองใหม่
          </Button>
        </Card>
      );
    }
    return (
      <Skeleton>
        <OrdersView
          orders={PLACEHOLDER}
          date={date}
          onDateChange={() => undefined}
          updatedAt="00:00 น."
          onAdvance={async () => undefined}
          onCancel={async () => undefined}
        />
      </Skeleton>
    );
  }

  return (
    <OrdersView
      orders={data}
      date={date}
      onDateChange={setDate}
      updatedAt={`${updatedAt.toLocaleTimeString("th-TH", TIME_FORMAT)} น.`}
      onAdvance={onAdvance}
      onCancel={onCancel}
    />
  );
}
