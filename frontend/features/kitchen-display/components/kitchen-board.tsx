"use client";

import { useEffect, useMemo, useState } from "react";
import { useClock } from "@/hooks/use-clock";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { SocketEvent } from "@/lib/socket";
import { notify } from "@/lib/toast";
import { KITCHEN_CONFIG } from "@/features/kitchen-display/lib/kitchen-config";
import type { SocketOrder } from "@/features/kitchen-display/lib/kitchen-api";
import { COLUMNS } from "@/features/kitchen-display/lib/columns";
import { isUrgent, matchesQuery, sortByWait } from "@/features/kitchen-display/lib/kitchen-utils";
import { playAlert, unlockAudio } from "@/features/kitchen-display/lib/sound";
import { useSoundSettings } from "@/features/kitchen-display/lib/sound-settings";
import type { KitchenItem, KitchenOrder, KitchenStatus } from "@/features/kitchen-display/types";
import { BoardFooter } from "./board-footer";
import { BoardSummary } from "./board-summary";
import { CancelItemDialog, type ItemCancelTarget } from "./cancel-item-dialog";
import { CancelOrderDialog } from "./cancel-order-dialog";
import { KitchenColumn } from "./kitchen-column";
import { KitchenHeader, formatClock } from "./kitchen-header";
import { OrderDetailDialog } from "./order-detail-dialog";
import { SoundSettingsDialog } from "./sound-settings-dialog";

export interface KitchenActions {
  /** เลื่อนสถานะไปขั้นถัดไป */
  advance: (order: KitchenOrder) => Promise<void>;
  cancelOrder: (order: KitchenOrder, reason: string) => Promise<void>;
  cancelItem: (order: KitchenOrder, item: KitchenItem, quantity: number, reason: string) => Promise<void>;
  /** รับทราบการยกเลิกจากหน้าร้าน */
  acknowledge: (order: KitchenOrder) => Promise<void>;
}

interface KitchenBoardProps {
  orders: KitchenOrder[];
  shopName: string;
  branch: string;
  actions: KitchenActions;
}

/**
 * กระดานครัว (client): แสดงงานจริงของร้าน เสียงแจ้งเตือน นาฬิกา และหน้าต่างต่างๆ
 * รับข้อมูลและ actions จาก KitchenScreen จึงใช้เรนเดอร์เป็น skeleton ได้ด้วย
 *
 * เสียงดังเมื่อมีออเดอร์ใหม่ (order:created) และเมื่อหน้าร้านยกเลิกงาน (order:updated สถานะ CANCELLED)
 * เลย์เอาต์คงที่สำหรับจอครัว (กว้างอย่างน้อย 1280px) ไม่ปรับตามขนาดจอ
 * เพื่อไม่ให้การ์ดเลื่อนทับกัน จอที่เล็กกว่านี้จะเลื่อนดูได้
 */
export function KitchenBoard({ orders, shopName, branch, actions }: KitchenBoardProps) {
  const { now } = useClock();
  // เวลาของกระดานเป็น epoch วินาที เทียบกับ since ของแต่ละงาน (0 จนกว่าจะ mount ฝั่ง client)
  const ticks = now ? Math.floor(now.getTime() / 1000) : 0;
  const [settings, updateSettings] = useSoundSettings();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<KitchenOrder | null>(null);
  const [itemTarget, setItemTarget] = useState<ItemCancelTarget | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const selected = orders.find((order) => order.id === selectedId) ?? null;
  const hasNew = orders.some((order) => order.status === "new" && !order.cancellation);

  // เบราว์เซอร์ยอมให้เล่นเสียงได้หลังแตะหน้าจอครั้งแรก
  useEffect(() => {
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    return () => window.removeEventListener("pointerdown", unlockAudio);
  }, []);

  // ออเดอร์ใหม่จากลูกค้า
  useSocketEvent<SocketOrder>(SocketEvent.OrderCreated, (order) => {
    notify.info(`ออเดอร์ใหม่ ${order.table}`, `#${order.number}`);
    if (settings.enabled) playAlert(settings.tone, settings.volume);
  });

  // หน้าร้านยกเลิกออเดอร์ (ครัวยังไม่ได้รับทราบ): การ์ดจะเป็นสีแดงให้ครัวหยุดทำและกดรับทราบ
  useSocketEvent<SocketOrder>(SocketEvent.OrderUpdated, (order) => {
    if (order.status !== "CANCELLED" || order.kitchenAck) return;
    notify.warning(`หน้าร้านยกเลิก ${order.table}`, `#${order.number} • หยุดทำและกดรับทราบ`);
    if (settings.enabled && settings.cancelEnabled) playAlert(settings.cancelTone, settings.volume);
  });

  // เตือนซ้ำเป็นระยะขณะที่ยังมีออเดอร์ใหม่ค้างอยู่ (ถ้าเปิดตัวเลือก)
  useEffect(() => {
    if (!settings.enabled || !settings.repeat || !hasNew) return;
    const id = setInterval(() => playAlert(settings.tone, settings.volume), KITCHEN_CONFIG.repeatAlertSeconds * 1000);
    return () => clearInterval(id);
  }, [hasNew, settings.enabled, settings.repeat, settings.tone, settings.volume]);

  const visibleByStatus = useMemo(() => {
    const result = {} as Record<KitchenStatus, KitchenOrder[]>;
    for (const { status } of COLUMNS) {
      result[status] = sortByWait(
        orders.filter((order) => order.status === status && matchesQuery(order, query)),
        ticks,
      );
    }
    return result;
  }, [orders, query, ticks]);

  const totalByStatus = (status: KitchenStatus) => orders.filter((order) => order.status === status).length;
  const cancelledCount = orders.filter((order) => order.cancellation).length;
  const urgentCount = orders.filter((order) => isUrgent(order, ticks, KITCHEN_CONFIG.urgentAfterMinutes)).length;

  async function acknowledge(order: KitchenOrder) {
    setSelectedId(null);
    await actions.acknowledge(order);
  }

  async function advance(order: KitchenOrder) {
    if (order.status === "ready") setSelectedId(null);
    await actions.advance(order);
  }

  async function cancelOrder(order: KitchenOrder, reason: string) {
    setCancelTarget(null);
    setSelectedId(null);
    await actions.cancelOrder(order, reason);
  }

  async function cancelItem({ order, item }: ItemCancelTarget, quantity: number, reason: string) {
    setItemTarget(null);
    await actions.cancelItem(order, item, quantity, reason);
  }

  return (
    <div className="bg-background h-screen overflow-auto">
      {/* เลย์เอาต์คงที่: กว้างขั้นต่ำ 1280px สูงขั้นต่ำ 640px เกินจากนั้นยืดเต็มจอ */}
      <div className="flex h-full min-h-[640px] min-w-[1280px] flex-col">
        <KitchenHeader
          shopName={shopName}
          branch={branch}
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
          urgentAfter={KITCHEN_CONFIG.urgentAfterMinutes}
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
              urgentAfter={KITCHEN_CONFIG.urgentAfterMinutes}
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
        urgentAfter={KITCHEN_CONFIG.urgentAfterMinutes}
        onClose={() => setSelectedId(null)}
        onAdvance={advance}
        onCancel={setCancelTarget}
        onCancelItem={(order, item) => setItemTarget({ order, item })}
        onAcknowledge={acknowledge}
      />
      <CancelOrderDialog order={cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={cancelOrder} />
      <CancelItemDialog target={itemTarget} onClose={() => setItemTarget(null)} onConfirm={cancelItem} />
      <SoundSettingsDialog
        open={settingsOpen}
        settings={settings}
        onChange={updateSettings}
        onClose={() => setSettingsOpen(false)}
        onSimulate={() => {
          notify.info("ทดสอบเสียง: ออเดอร์ใหม่");
          playAlert(settings.tone, settings.volume);
        }}
        onSimulateFrontCancel={() => {
          notify.info("ทดสอบเสียง: หน้าร้านยกเลิก");
          playAlert(settings.cancelTone, settings.volume);
        }}
      />
    </div>
  );
}
