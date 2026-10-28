"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, m } from "framer-motion";
import { PiCaretDownBold, PiQrCodeBold, PiReceiptFill, PiWarningFill } from "react-icons/pi";
import { Button, Spinner } from "@/components/ui";
import { siteConfig } from "@/config/site";
import { toApiError } from "@/lib/http/api-error";
import { customerApi, type CustomerOrder } from "@/features/customer-order/lib/customer-api";
import { baht, timeLabel } from "@/features/customer-order/lib/format";
import { CustomerNav } from "./customer-nav";
import { OrderProgress } from "./order-progress";

const POLL_MS = 10_000;
/** รายการอาหารที่แสดงก่อนกด "ดูทั้งหมด" */
const PREVIEW_ITEMS = 3;

function ItemRow({ item }: { item: CustomerOrder["items"][number] }) {
  return (
    <li className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-foreground text-sm leading-snug font-medium">{item.name}</p>
        {item.options.length > 0 && <p className="text-muted-foreground text-xs">{item.options.join(" • ")}</p>}
        {item.note && <p className="text-warning-strong text-xs">หมายเหตุ: {item.note}</p>}
      </div>
      <span className="text-foreground shrink-0 text-sm font-semibold tabular-nums">× {item.quantity}</span>
    </li>
  );
}

/** รายการอาหารของออเดอร์ ย่อไว้ก่อนถ้ายาว กดเพื่อดูครบทุกรายการ */
function OrderItems({ items }: { items: CustomerOrder["items"] }) {
  const [expanded, setExpanded] = useState(false);
  const hidden = items.slice(PREVIEW_ITEMS);

  return (
    <div className="bg-surface rounded-2xl px-3">
      <ul className="divide-border divide-y">
        {items.slice(0, PREVIEW_ITEMS).map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </ul>
      <AnimatePresence initial={false}>
        {expanded && (
          <m.ul
            key="more"
            className="divide-border border-border divide-y overflow-hidden border-t"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {hidden.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </m.ul>
        )}
      </AnimatePresence>
      {hidden.length > 0 && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className="text-primary-strong focus-visible:ring-primary/50 border-border flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 border-t text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
        >
          {expanded ? "ย่อรายการ" : `ดูทั้งหมด (อีก ${hidden.length} รายการ)`}
          <m.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.25 }} className="flex">
            <PiCaretDownBold className="size-4" aria-hidden />
          </m.span>
        </button>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: CustomerOrder }) {
  const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <li className="bg-primary-soft flex flex-col gap-4 rounded-3xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-foreground text-lg leading-tight font-bold">ออเดอร์ #{order.number}</p>
          <p className="text-muted-foreground text-xs tabular-nums">สั่งเมื่อ {timeLabel(order.createdAt)} น.</p>
        </div>
        <span className="bg-surface text-primary-strong rounded-full px-3 py-1.5 text-xs font-semibold">{count} รายการ</span>
      </div>

      {order.status === "CANCELLED" ? (
        <p className="bg-danger-soft text-danger-strong rounded-xl px-3 py-2.5 text-sm">
          ออเดอร์นี้ถูกยกเลิก{order.cancelReason ? `: ${order.cancelReason}` : ""}
        </p>
      ) : (
        <div className="bg-surface rounded-2xl px-3 pt-4 pb-3">
          <OrderProgress status={order.status} />
        </div>
      )}

      <OrderItems items={order.items} />

      <p className="text-foreground flex items-baseline justify-between px-1">
        <span className="text-sm">รวม</span>
        <span className="font-display text-xl font-bold tabular-nums">{baht(order.total)}</span>
      </p>
    </li>
  );
}

function Group({ title, orders }: { title: string; orders: CustomerOrder[] }) {
  if (orders.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-foreground text-base font-bold">
        {title} <span className="text-muted-foreground font-normal">{orders.length}</span>
      </h2>
      <ul className="flex flex-col gap-4">
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
          {invalid ? <PiQrCodeBold className="size-7" /> : <PiWarningFill className="size-7" />}
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
    <div className="min-h-dvh pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <header className="bg-surface border-border border-b">
        <div className="mx-auto flex h-16 max-w-xl items-center gap-3 px-4">
          <Image src="/images/logo.svg" alt="" width={36} height={36} unoptimized className="shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="font-display text-foreground truncate text-[15px] leading-tight font-bold tracking-wide">
              {siteConfig.name}
            </span>
            <span className="text-muted-foreground truncate text-[11px]">สั่งปุ๊บ เด้งปั๊บ ถึงครัวทันที</span>
          </div>
          {tableName && (
            <span className="bg-primary text-primary-foreground shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold">
              {tableName}
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-5">
        <div className="flex items-center gap-3">
          <span className="bg-primary text-primary-foreground flex size-12 shrink-0 items-center justify-center rounded-full">
            <PiReceiptFill className="size-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-foreground text-xl leading-tight font-bold">ประวัติการสั่ง</h1>
            <p className="text-muted-foreground text-xs">ติดตามสถานะอาหารที่สั่งไว้</p>
          </div>
          {orders.length > 0 && (
            <div className="text-right">
              <p className="text-muted-foreground text-[11px]">ยอดรวมทั้งโต๊ะ</p>
              <p className="font-display text-foreground text-lg leading-tight font-bold tabular-nums">{baht(sum)}</p>
            </div>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-3 py-20 text-center text-sm">
            <span className="bg-primary-soft text-primary flex size-14 items-center justify-center rounded-full">
              <PiReceiptFill className="size-7" aria-hidden />
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
