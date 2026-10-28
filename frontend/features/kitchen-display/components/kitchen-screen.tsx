"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Skeleton } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { shopApi, type Shop } from "@/features/shop/lib/shop-api";
import { kitchenApi } from "@/features/kitchen-display/lib/kitchen-api";
import { activeQuantity } from "@/features/kitchen-display/lib/kitchen-utils";
import type { KitchenOrder } from "@/features/kitchen-display/types";
import { useResource } from "@/hooks/use-resource";
import { ApiError } from "@/lib/http/api-error";
import { SocketEvent } from "@/lib/socket";
import { notify } from "@/lib/toast";
import { KitchenBoard, type KitchenActions } from "./kitchen-board";

const NOW = Math.floor(Date.now() / 1000);

const PLACEHOLDER: KitchenOrder[] = Array.from({ length: 6 }, (_, index) => ({
  id: `p${index}`,
  code: `#${index}`,
  table: "0",
  orderedAt: "00:00",
  items: [
    { id: `i${index}a`, name: "รายการอาหารตัวอย่าง", quantity: 2 },
    { id: `i${index}b`, name: "รายการอาหารตัวอย่างที่สอง", quantity: 1 },
  ],
  notes: [],
  total: 100,
  payment: { state: "unpaid", method: "เงินสด" },
  status: (["new", "preparing", "ready"] as const)[index % 3],
  since: NOW,
}));

const NOOP_ACTIONS: KitchenActions = {
  advance: async () => undefined,
  cancelOrder: async () => undefined,
  cancelItem: async () => undefined,
  acknowledge: async () => undefined,
};

/** หน้าจอครัวของร้านจริง: ออเดอร์เข้ามาสดผ่าน Socket.IO และทุกการกระทำของครัวแจ้งหน้าร้านทันที */
export function KitchenScreen() {
  const router = useRouter();
  const { data, setData, error, reload } = useResource(kitchenApi.list, {
    refetchOn: [SocketEvent.OrderCreated, SocketEvent.OrderUpdated],
    debounceMs: 150,
  });
  const [shop, setShop] = useState<Shop>();

  useEffect(() => {
    shopApi.get().then(
      ({ data }) => setShop(data),
      (e: unknown) => {
        if (e instanceof ApiError && e.status === 401) router.replace(ROUTES.login);
      },
    );
  }, [router]);

  const actions = useMemo<KitchenActions>(() => {
    const replace = (order: KitchenOrder) =>
      setData((current) => current?.map((item) => (item.id === order.id ? order : item)));
    const remove = (order: KitchenOrder) =>
      setData((current) => current?.filter((item) => item.id !== order.id));
    const fail = (e: unknown) => {
      notify.error(e);
      reload();
    };

    return {
      async advance(order) {
        try {
          await kitchenApi.advance(order);
          if (order.status === "ready") {
            remove(order);
            notify.success(`เสิร์ฟโต๊ะ ${order.table} แล้ว`, order.code);
          } else {
            const next = order.status === "new" ? "preparing" : "ready";
            replace({ ...order, status: next, since: Math.floor(Date.now() / 1000) });
            notify.success(
              next === "preparing" ? `รับโต๊ะ ${order.table} เข้าครัวแล้ว` : `โต๊ะ ${order.table} พร้อมเสิร์ฟ`,
              order.code,
            );
          }
        } catch (e) {
          fail(e);
        }
      },

      async cancelOrder(order, reason) {
        try {
          await kitchenApi.cancelOrder(order, reason);
          remove(order);
          notify.warning(
            `ยกเลิกโต๊ะ ${order.table} แล้ว • แจ้งหน้าร้านแล้ว`,
            `${order.code} • ${reason}${order.payment.state === "paid" ? " • ต้องคืนเงิน" : ""}`,
          );
        } catch (e) {
          fail(e);
        }
      },

      async cancelItem(order, item, quantity, reason) {
        try {
          await kitchenApi.cancelItem(order, item.id, quantity, reason);
          const items = order.items.map((line) =>
            line.id === item.id ? { ...line, cancelledQty: (line.cancelledQty ?? 0) + quantity, cancelReason: reason } : line,
          );
          // ยกเลิกครบทุกจานแล้ว server ยกเลิกทั้งออเดอร์ให้เอง
          if (items.every((line) => activeQuantity(line) === 0)) remove(order);
          else replace({ ...order, items });
          notify.warning(
            `ยกเลิก ${item.name} ${quantity} ที่ • แจ้งหน้าร้านแล้ว`,
            `${order.code} โต๊ะ ${order.table} • ${reason}${order.payment.state === "paid" ? " • ต้องคืนเงินส่วนนี้" : ""}`,
          );
        } catch (e) {
          fail(e);
        }
      },

      async acknowledge(order) {
        try {
          await kitchenApi.acknowledge(order);
          remove(order);
          notify.success(`รับทราบการยกเลิกโต๊ะ ${order.table} แล้ว`, order.code);
        } catch (e) {
          fail(e);
        }
      },
    };
  }, [reload, setData]);

  if (error && !data) {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <Card role="alert" className="flex max-w-md flex-col items-start gap-3 p-6">
          <p className="text-danger text-sm">โหลดออเดอร์ของครัวไม่สำเร็จ: {error}</p>
          <Button variant="outline" onClick={reload}>
            ลองใหม่
          </Button>
        </Card>
      </div>
    );
  }

  if (!data || !shop) {
    return (
      <Skeleton>
        <KitchenBoard orders={PLACEHOLDER} shopName="ชื่อร้านตัวอย่าง" branch="สาขาตัวอย่าง" actions={NOOP_ACTIONS} />
      </Skeleton>
    );
  }

  return <KitchenBoard orders={data} shopName={shop.name} branch={shop.branch || "ครัวหลัก"} actions={actions} />;
}
