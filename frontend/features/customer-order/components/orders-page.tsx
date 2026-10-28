"use client";

import { useCallback, useEffect, useState } from "react";
import { Receipt, ScanLine, TriangleAlert } from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import { cn } from "@/lib/cn";
import { toApiError } from "@/lib/http/api-error";
import { customerApi, type CustomerOrder } from "@/features/customer-order/lib/customer-api";
import { STATUS_LABEL, STATUS_STEPS, baht, timeLabel } from "@/features/customer-order/lib/format";
import { CustomerNav } from "./customer-nav";

const POLL_MS = 10_000;

function Progress({ status }: { status: CustomerOrder["status"] }) {
  const current = STATUS_STEPS.indexOf(status as (typeof STATUS_STEPS)[number]);
  return (
    <ol className="flex gap-1.5" aria-label="ความคืบหน้าของออเดอร์">
      {STATUS_STEPS.map((step, index) => (
        <li key={step} className="flex flex-1 flex-col gap-1.5">
          <span className={cn("h-1.5 rounded-full", index <= current ? "bg-primary" : "bg-border")} />
          <span
            className={cn(
              "text-[11px] leading-tight",
              index === current ? "text-primary-strong font-semibold" : "text-muted-foreground",
            )}
          >
            {STATUS_LABEL[step]}
          </span>
        </li>
      ))}
    </ol>
  );
}

function OrderCard({ order }: { order: CustomerOrder }) {
  return (
    <li className="bg-surface border-border flex flex-col gap-4 rounded-2xl border p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-foreground text-lg">ออเดอร์ #{order.number}</p>
        <p className="text-muted-foreground text-[13px] tabular-nums">{timeLabel(order.createdAt)} น.</p>
      </div>

      {order.status === "CANCELLED" ? (
        <p className="bg-danger-soft text-danger-strong rounded-lg px-3 py-2 text-sm">
          ออเดอร์นี้ถูกยกเลิก{order.cancelReason ? `: ${order.cancelReason}` : ""}
        </p>
      ) : (
        <Progress status={order.status} />
      )}

      <ul className="text-foreground flex flex-col gap-1.5 text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3">
            <span>
              {item.name}
              {item.options.length > 0 && (
                <span className="text-muted-foreground block text-xs">{item.options.join(" • ")}</span>
              )}
              {item.note && <span className="text-warning-strong block text-xs">หมายเหตุ: {item.note}</span>}
            </span>
            <span className="text-muted-foreground tabular-nums">× {item.quantity}</span>
          </li>
        ))}
      </ul>
      <p className="border-border text-foreground flex justify-between border-t pt-3 text-sm font-semibold tabular-nums">
        <span>รวม</span>
        {baht(order.total)}
      </p>
    </li>
  );
}

function Group({ title, orders }: { title: string; orders: CustomerOrder[] }) {
  if (orders.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-foreground text-base font-semibold">
        {title} <span className="text-muted-foreground font-normal">{orders.length}</span>
      </h2>
      <ul className="flex flex-col gap-3">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </ul>
    </section>
  );
}

/** หน้าประวัติการสั่งของโต๊ะ: ออเดอร์ที่กำลังทำอยู่ขึ้นก่อน สถานะอัปเดตเองทุก 10 วินาที */
export function OrdersPage({ token }: { token: string }) {
  const [orders, setOrders] = useState<CustomerOrder[]>();
  const [tableName, setTableName] = useState("");
  const [error, setError] = useState<"invalid" | "failed" | null>(null);

  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const [menu, next] = await Promise.all([customerApi.menu(token, signal), customerApi.orders(token, signal)]);
        setTableName(menu.table.name);
        setOrders(next);
        setError(null);
      } catch (e) {
        if (signal?.aborted) return;
        setError((current) => (toApiError(e).status === 404 ? "invalid" : (current ?? "failed")));
      }
    },
    [token],
  );

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh(controller.signal);
    }, POLL_MS);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [refresh]);

  if (error && !orders) {
    const invalid = error === "invalid";
    return (
      <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="bg-warning-soft text-warning-strong flex size-14 items-center justify-center rounded-full">
          {invalid ? <ScanLine className="size-7" /> : <TriangleAlert className="size-7" />}
        </span>
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-foreground text-xl">{invalid ? "QR นี้ใช้ไม่ได้" : "โหลดประวัติไม่สำเร็จ"}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {invalid ? "ลองสแกน QR ที่โต๊ะใหม่อีกครั้ง หรือเรียกพนักงาน" : "ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่"}
          </p>
        </div>
        {!invalid && <Button onClick={() => void refresh()}>ลองใหม่</Button>}
      </div>
    );
  }

  if (!orders) {
    return (
      <div role="status" aria-label="กำลังโหลดประวัติ" className="flex min-h-dvh items-center justify-center">
        <Spinner className="text-primary size-8" />
      </div>
    );
  }

  const active = orders.filter((o) => o.status !== "SERVED" && o.status !== "CANCELLED");
  const done = orders.filter((o) => o.status === "SERVED" || o.status === "CANCELLED");
  const sum = orders.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + o.total, 0);

  return (
    <div className="min-h-dvh pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <header className="bg-surface border-border border-b">
        <div className="mx-auto flex h-16 max-w-xl items-center justify-between gap-3 px-4">
          <div>
            <h1 className="font-display text-foreground text-xl leading-tight">ประวัติการสั่ง</h1>
            <p className="text-muted-foreground text-xs">{tableName}</p>
          </div>
          {orders.length > 0 && (
            <div className="text-right">
              <p className="text-muted-foreground text-xs">ยอดรวมทั้งโต๊ะ</p>
              <p className="font-display text-foreground text-lg leading-tight tabular-nums">{baht(sum)}</p>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-5">
        {orders.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-3 py-20 text-center text-sm">
            <span className="bg-primary-soft text-primary flex size-14 items-center justify-center rounded-full">
              <Receipt className="size-7" aria-hidden />
            </span>
            <p className="text-foreground text-base font-semibold">ยังไม่มีออเดอร์</p>
            <p>เลือกเมนูแล้วกดส่งเข้าครัว ออเดอร์จะมาแสดงที่นี่</p>
          </div>
        ) : (
          <>
            <Group title="กำลังดำเนินการ" orders={active} />
            <Group title="เสร็จสิ้น" orders={done} />
          </>
        )}
      </main>

      <CustomerNav token={token} active="orders" inProgress={active.length} />
    </div>
  );
}
