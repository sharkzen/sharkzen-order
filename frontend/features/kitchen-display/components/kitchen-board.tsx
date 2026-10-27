"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useClock } from "@/hooks/use-clock";
import { notify } from "@/lib/toast";
import { KITCHEN, SIMULATED_ORDERS } from "../data/kitchen-orders";
import { COLUMNS } from "../lib/columns";
import {
  NEXT_STATUS,
  activeQuantity,
  isUrgent,
  matchesQuery,
  sortByWait,
} from "../lib/kitchen-utils";
import { playAlert, unlockAudio } from "../lib/sound";
import { useSoundSettings } from "../lib/sound-settings";
import type { KitchenItem, KitchenOrder, KitchenStatus } from "../types";
import { BoardFooter } from "./board-footer";
import { BoardSummary } from "./board-summary";
import { CancelItemDialog, type ItemCancelTarget } from "./cancel-item-dialog";
import { CancelOrderDialog } from "./cancel-order-dialog";
import { KitchenColumn } from "./kitchen-column";
import { KitchenHeader, formatClock, formatHourMinute } from "./kitchen-header";
import { OrderDetailDialog } from "./order-detail-dialog";
import { SoundSettingsDialog } from "./sound-settings-dialog";

/**
 * กระดานครัว (client): เก็บสถานะของทุกงาน นาฬิกา เสียงแจ้งเตือน และหน้าต่างต่างๆ
 *
 * จุดต่อ API:
 * - receiveOrder()            ออเดอร์ใหม่เข้ามาจากลูกค้า
 * - receiveFrontCancellation() หน้าร้านยกเลิกออเดอร์ที่ /orders (ครัวต้องกดรับทราบ)
 * - advance() / cancelOrder() / cancelItem()  การกระทำของครัว ซึ่งต้องแจ้งหน้าร้านด้วย
 *
 * เลย์เอาต์คงที่สำหรับจอครัว (กว้างอย่างน้อย 1280px) ไม่ปรับตามขนาดจอ
 * เพื่อไม่ให้การ์ดเลื่อนทับกัน จอที่เล็กกว่านี้จะเลื่อนดูได้
 */
export function KitchenBoard({
  initialOrders,
}: {
  initialOrders: KitchenOrder[];
}) {
  const { now, ticks } = useClock();
  const [settings, updateSettings] = useSoundSettings();
  const [orders, setOrders] = useState(initialOrders);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<KitchenOrder | null>(null);
  const [itemTarget, setItemTarget] = useState<ItemCancelTarget | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const simulated = useRef(0);

  const selected = orders.find((order) => order.id === selectedId) ?? null;
  const hasNew = orders.some(
    (order) => order.status === "new" && !order.cancellation,
  );

  // เบราว์เซอร์ยอมให้เล่นเสียงได้หลังแตะหน้าจอครั้งแรก
  useEffect(() => {
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    return () => window.removeEventListener("pointerdown", unlockAudio);
  }, []);

  // เตือนซ้ำเป็นระยะขณะที่ยังมีออเดอร์ใหม่ค้างอยู่ (ถ้าเปิดตัวเลือก)
  useEffect(() => {
    if (!settings.enabled || !settings.repeat || !hasNew) return;
    const id = setInterval(
      () => playAlert(settings.tone, settings.volume),
      KITCHEN.repeatAlertSeconds * 1000,
    );
    return () => clearInterval(id);
  }, [
    hasNew,
    settings.enabled,
    settings.repeat,
    settings.tone,
    settings.volume,
  ]);

  const visibleByStatus = useMemo(() => {
    const result = {} as Record<KitchenStatus, KitchenOrder[]>;
    for (const { status } of COLUMNS) {
      result[status] = sortByWait(
        orders.filter(
          (order) => order.status === status && matchesQuery(order, query),
        ),
        ticks,
      );
    }
    return result;
  }, [orders, query, ticks]);

  const totalByStatus = (status: KitchenStatus) =>
    orders.filter((order) => order.status === status).length;
  const cancelledCount = orders.filter((order) => order.cancellation).length;
  const urgentCount = orders.filter((order) =>
    isUrgent(order, ticks, KITCHEN.urgentAfterMinutes),
  ).length;

  /** ออเดอร์ใหม่เข้ามา: เพิ่มการ์ด เล่นเสียง และแจ้งเตือน (ต่อ API realtime ที่ฟังก์ชันนี้) */
  function receiveOrder(order: KitchenOrder) {
    setOrders((prev) => [...prev, order]);
    notify.info(`ออเดอร์ใหม่ โต๊ะ ${order.table}`, order.id);
    if (settings.enabled) playAlert(settings.tone, settings.volume);
  }

  function simulateOrder() {
    const index = simulated.current++;
    const sample = SIMULATED_ORDERS[index % SIMULATED_ORDERS.length];
    receiveOrder({
      ...sample,
      id: `#${String(1260 + index).padStart(5, "0")}`,
      orderedAt: formatHourMinute(now),
      status: "new",
      since: ticks,
    });
  }

  /**
   * หน้าร้านยกเลิกออเดอร์ที่ /orders: ไม่ลบการ์ดทันที แต่ทำเป็นสีแดงให้ครัวหยุดทำ
   * และกดรับทราบก่อน เพื่อไม่ให้การ์ดหายเงียบๆ ระหว่างที่พ่อครัวกำลังทำอยู่
   */
  function receiveFrontCancellation(orderId: string, reason: string) {
    const target = orders.find((order) => order.id === orderId);
    if (!target || target.cancellation) return;
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, cancellation: { reason } } : order,
      ),
    );
    notify.warning(
      `หน้าร้านยกเลิกโต๊ะ ${target.table}`,
      `${target.id} • หยุดทำและกดรับทราบ`,
    );
    if (settings.enabled && settings.cancelEnabled)
      playAlert(settings.cancelTone, settings.volume);
  }

  function simulateFrontCancel() {
    const target =
      orders.find((o) => o.status === "preparing" && !o.cancellation) ??
      orders.find((o) => o.status === "new" && !o.cancellation);
    if (!target) {
      notify.info("ไม่มีงานให้จำลองการยกเลิก");
      return;
    }
    receiveFrontCancellation(target.id, "ลูกค้าขอยกเลิก");
  }

  function acknowledge(order: KitchenOrder) {
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
    setSelectedId(null);
    notify.success(`รับทราบการยกเลิกโต๊ะ ${order.table} แล้ว`, order.id);
  }

  function advance(order: KitchenOrder) {
    const next = NEXT_STATUS[order.status];

    if (next === null) {
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      notify.success(`เสิร์ฟโต๊ะ ${order.table} แล้ว`, order.id);
      setSelectedId(null);
      return;
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: next,
              since: ticks,
            }
          : o,
      ),
    );
    notify.success(
      next === "preparing"
        ? `รับโต๊ะ ${order.table} เข้าครัวแล้ว`
        : `โต๊ะ ${order.table} พร้อมเสิร์ฟ`,
      order.id,
    );
  }

  /** ครัวยกเลิกทั้งออเดอร์ (เหตุผลฝั่งครัวเท่านั้น) แล้วแจ้งหน้าร้านให้ติดต่อลูกค้า/คืนเงิน */
  function cancelOrder(order: KitchenOrder, reason: string) {
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
    setCancelTarget(null);
    setSelectedId(null);
    notify.warning(
      `ยกเลิกโต๊ะ ${order.table} แล้ว • แจ้งหน้าร้านแล้ว`,
      `${order.id} • ${reason}${order.payment.state === "paid" ? " • ต้องคืนเงิน" : ""}`,
    );
  }

  /** ครัวยกเลิกรายจาน (บางจำนวนหรือทั้งหมด) ถ้ายกเลิกครบทุกจานจะยกเลิกทั้งออเดอร์ */
  function cancelItem(
    { order, item }: ItemCancelTarget,
    quantity: number,
    reason: string,
  ) {
    setItemTarget(null);

    const updatedItems: KitchenItem[] = order.items.map((current) =>
      current.name === item.name
        ? {
            ...current,
            cancelledQty: (current.cancelledQty ?? 0) + quantity,
            cancelReason: reason,
          }
        : current,
    );
    const remaining = updatedItems.reduce(
      (sum, current) => sum + activeQuantity(current),
      0,
    );

    if (remaining === 0) {
      cancelOrder(order, reason);
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, items: updatedItems } : o)),
    );
    notify.warning(
      `ยกเลิก ${item.name} ${quantity} ที่ • แจ้งหน้าร้านแล้ว`,
      `${order.id} โต๊ะ ${order.table} • ${reason}${order.payment.state === "paid" ? " • ต้องคืนเงินส่วนนี้" : ""}`,
    );
  }

  return (
    <div className="bg-background h-screen overflow-auto">
      {/* เลย์เอาต์คงที่: กว้างขั้นต่ำ 1280px สูงขั้นต่ำ 640px เกินจากนั้นยืดเต็มจอ */}
      <div className="flex h-full min-h-[640px] min-w-[1280px] flex-col">
        <KitchenHeader
          now={now}
          soundOn={settings.enabled}
          onToggleSound={() => {
            updateSettings({ enabled: !settings.enabled });
            if (!settings.enabled) playAlert(settings.tone, settings.volume);
          }}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <BoardSummary
          active={orders.length - cancelledCount}
          urgent={urgentCount}
          urgentAfter={KITCHEN.urgentAfterMinutes}
          cancelled={cancelledCount}
          query={query}
          onQueryChange={setQuery}
        />

        <main className="grid min-h-0 flex-1 grid-cols-3 gap-4 px-5 py-4">
          {COLUMNS.map(({ status }) => (
            <KitchenColumn
              key={status}
              status={status}
              orders={visibleByStatus[status]}
              total={totalByStatus(status)}
              searching={query.trim() !== ""}
              ticks={ticks}
              urgentAfter={KITCHEN.urgentAfterMinutes}
              onAdvance={advance}
              onCancel={setCancelTarget}
              onAcknowledge={acknowledge}
              onOpen={(order) => setSelectedId(order.id)}
            />
          ))}
        </main>

        <BoardFooter updatedAt={formatClock(now)} />
      </div>

      <OrderDetailDialog
        order={selected}
        ticks={ticks}
        urgentAfter={KITCHEN.urgentAfterMinutes}
        onClose={() => setSelectedId(null)}
        onAdvance={advance}
        onCancel={setCancelTarget}
        onCancelItem={(order, item) => setItemTarget({ order, item })}
        onAcknowledge={acknowledge}
      />
      <CancelOrderDialog
        order={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={cancelOrder}
      />
      <CancelItemDialog
        target={itemTarget}
        onClose={() => setItemTarget(null)}
        onConfirm={cancelItem}
      />
      <SoundSettingsDialog
        open={settingsOpen}
        settings={settings}
        onChange={updateSettings}
        onClose={() => setSettingsOpen(false)}
        onSimulate={simulateOrder}
        onSimulateFrontCancel={simulateFrontCancel}
      />
    </div>
  );
}
