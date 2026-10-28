"use client";

import { useMemo } from "react";
import { Button, Card, Skeleton } from "@/components/ui";
import { useShop } from "@/features/shop/components/shop-provider";
import { tablesApi } from "@/features/table-management/lib/tables-api";
import { cashierApi, type CashierData } from "@/features/cashier/lib/cashier-api";
import type { CheckoutConfig, TableBill } from "@/features/cashier/types";
import { useResource } from "@/hooks/use-resource";
import { SocketEvent } from "@/lib/socket";
import { notify } from "@/lib/toast";
import { CashierView, type CashierActions } from "./cashier-workspace";

const PLACEHOLDER_CONFIG: CheckoutConfig = {
  serviceChargePercent: 0,
  vatIncluded: true,
  promptPayId: "",
  shopName: "",
  branch: "",
  phone: "",
  address: "",
};

const PLACEHOLDER_BILLS: TableBill[] = Array.from({ length: 6 }, (_, index) => ({
  tableId: `p${index}`,
  tableName: "โต๊ะ 0",
  zone: "โซนตัวอย่าง",
  openedAt: "00:00",
  openedAtMs: Date.now(),
  lastOrderAtMs: Date.now(),
  rounds: [
    {
      orderId: `o${index}`,
      number: index,
      time: "00:00",
      served: true,
      lines: [{ name: "รายการอาหารตัวอย่าง", quantity: 1, unitPrice: 100 }],
    },
  ],
  payment: null,
}));

const NOOP_ACTIONS: CashierActions = {
  pay: async () => undefined,
  closeTable: async () => false,
};

const TIME_FORMAT: Intl.DateTimeFormatOptions = { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit" };

/** หน้าคิดเงิน: บิลของโต๊ะที่เปิดอยู่ อัปเดตสดเมื่อมีออเดอร์ใหม่ โต๊ะเปิด-ปิด หรือมีการชำระเงิน */
export function CashierWorkspace() {
  const { shop } = useShop();
  const { data, setData, error, reload } = useResource(cashierApi.list, {
    refetchOn: [SocketEvent.OrderCreated, SocketEvent.OrderUpdated, SocketEvent.TablesChanged, SocketEvent.ShopUpdated],
  });

  const config = useMemo<CheckoutConfig | undefined>(
    () =>
      shop && {
        serviceChargePercent: shop.serviceChargePercent,
        vatIncluded: shop.vatIncluded,
        promptPayId: shop.promptPayId,
        shopName: shop.name,
        branch: shop.branch,
        phone: shop.phone,
        address: shop.address,
      },
    [shop],
  );

  const actions = useMemo<CashierActions>(() => {
    const update = (fn: (current: CashierData) => CashierData) =>
      setData((current) => (current ? fn(current) : current));

    return {
      async pay(tableId, input) {
        try {
          const payment = await cashierApi.pay(tableId, input);
          update((current) => ({
            collectedToday: current.collectedToday + payment.total,
            bills: current.bills.map((bill) => (bill.tableId === tableId ? { ...bill, payment } : bill)),
          }));
          return payment;
        } catch (e) {
          notify.error(e);
          reload();
          return undefined;
        }
      },

      async closeTable(bill) {
        try {
          await tablesApi.close(bill.tableId);
          update((current) => ({ ...current, bills: current.bills.filter((item) => item.tableId !== bill.tableId) }));
          return true;
        } catch (e) {
          notify.error(e);
          return false;
        }
      },
    };
  }, [reload, setData]);

  if (error && !data) {
    return (
      <Card role="alert" className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-danger text-sm">โหลดบิลไม่สำเร็จ: {error}</p>
        <Button variant="outline" onClick={reload}>
          ลองใหม่
        </Button>
      </Card>
    );
  }

  if (!data || !config) {
    return (
      <Skeleton>
        <CashierView
          bills={PLACEHOLDER_BILLS}
          collectedToday={0}
          updatedAt="00:00 น."
          actions={NOOP_ACTIONS}
          config={PLACEHOLDER_CONFIG}
        />
      </Skeleton>
    );
  }

  return (
    <CashierView
      bills={data.bills}
      collectedToday={data.collectedToday}
      updatedAt={`${new Date().toLocaleTimeString("th-TH", TIME_FORMAT)} น.`}
      actions={actions}
      config={config}
    />
  );
}
