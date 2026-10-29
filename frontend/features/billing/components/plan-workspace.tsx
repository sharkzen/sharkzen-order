"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Skeleton } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { billingApi, type BillingOverview, type Invoice } from "@/features/billing/lib/billing-api";
import { useShop } from "@/features/shop/components/shop-provider";
import { useResource } from "@/hooks/use-resource";
import { notify } from "@/lib/toast";
import { PlanView, type PlanActions } from "./plan-view";

const PLACEHOLDER: BillingOverview = {
  subscription: {
    plan: "growth",
    billing: "yearly",
    status: "TRIALING",
    trialEndsAt: "2000-01-15T00:00:00.000Z",
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    paying: false,
    method: null,
    autoRenew: false,
  },
  usage: { tables: 0, staff: 0, branches: 1 },
  limits: { tables: null, staff: 10, branches: 1 },
};

const PLACEHOLDER_INVOICES: Invoice[] = Array.from({ length: 3 }, (_, index) => ({
  id: `p${index}`,
  number: "INV-0000",
  description: "แพ็กเกจตัวอย่าง",
  date: "2000-01-01T00:00:00.000Z",
  amount: 100,
  status: "paid",
  pdfUrl: null,
  hostedUrl: null,
}));

const NOOP_ACTIONS: PlanActions = {
  checkout: async () => undefined,
  change: async () => undefined,
  portal: async () => undefined,
  cancel: async () => undefined,
  resume: async () => undefined,
};

/** ไปหน้าอื่นนอกแอป (Stripe) ด้วยการเปลี่ยนหน้าทั้งหน้า */
const goTo = (url: string) => window.location.assign(url);

/** หน้าแพ็กเกจและการชำระเงิน: สมัคร/เปลี่ยน/ยกเลิกแพ็กเกจผ่าน Stripe และดูการใช้งานเทียบกับสิทธิ์ */
export function PlanWorkspace() {
  const router = useRouter();
  const params = useSearchParams();
  const { setSubscription } = useShop();
  const { data, setData, error, reload } = useResource(billingApi.overview);
  const invoices = useResource(billingApi.invoices);
  const [now] = useState(() => Date.now());

  // กลับจากหน้าชำระเงินของ Stripe: บันทึกสถานะล่าสุดทันที (ไม่ต้องรอ webhook)
  const handled = useRef(false);
  useEffect(() => {
    const checkout = params.get("checkout");
    if (!checkout || handled.current) return;
    handled.current = true;
    router.replace(ROUTES.plan);
    if (checkout === "cancelled") {
      notify.info("ยกเลิกการชำระเงินแล้ว", "ยังไม่มีการเก็บเงิน เลือกแพ็กเกจใหม่ได้ทุกเมื่อ");
      return;
    }
    const sessionId = params.get("session_id");
    if (!sessionId) return;
    billingApi.sync(sessionId).then(
      (subscription) => {
        setData((current) => (current ? { ...current, subscription } : current));
        setSubscription(subscription);
        invoices.reload();
        notify.success("สมัครแพ็กเกจเรียบร้อย", "ขอบคุณที่ใช้ SHARKZEN ORDER");
      },
      (e) => notify.error(e),
    );
  }, [params, router, setData, setSubscription, invoices]);

  const actions = useMemo<PlanActions>(() => {
    const apply = (subscription: BillingOverview["subscription"]) => {
      setData((current) => (current ? { ...current, subscription } : current));
      setSubscription(subscription);
      reload();
    };

    return {
      async checkout(choice) {
        try {
          const url = await billingApi.checkout(choice);
          if (url) goTo(url);
          else notify.error(new Error("เปิดหน้าชำระเงินไม่สำเร็จ ลองใหม่อีกครั้ง"));
        } catch (e) {
          notify.error(e);
        }
      },
      async change(choice) {
        try {
          apply(await billingApi.change(choice));
          notify.success("เปลี่ยนแพ็กเกจแล้ว", "สิทธิ์ใหม่มีผลทันที");
        } catch (e) {
          notify.error(e);
        }
      },
      async portal() {
        try {
          goTo(await billingApi.portal());
        } catch (e) {
          notify.error(e);
        }
      },
      async cancel() {
        try {
          apply(await billingApi.cancel());
          notify.success("ยกเลิกแพ็กเกจแล้ว", "ยังใช้งานได้จนสิ้นรอบบิล");
        } catch (e) {
          notify.error(e);
        }
      },
      async resume() {
        try {
          apply(await billingApi.resume());
          notify.success("ต่ออายุแพ็กเกจแล้ว", "จะตัดเงินตามรอบบิลต่อไปตามปกติ");
        } catch (e) {
          notify.error(e);
        }
      },
    };
  }, [reload, setData, setSubscription]);

  if (!data) {
    if (error) {
      return (
        <Card role="alert" className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-danger text-sm">โหลดข้อมูลแพ็กเกจไม่สำเร็จ: {error}</p>
          <Button variant="outline" onClick={reload}>
            ลองใหม่
          </Button>
        </Card>
      );
    }
    return (
      <Skeleton>
        <PlanView overview={PLACEHOLDER} invoices={PLACEHOLDER_INVOICES} now={Date.parse("2000-01-01")} actions={NOOP_ACTIONS} />
      </Skeleton>
    );
  }

  return <PlanView overview={data} invoices={invoices.data ?? []} now={now} actions={actions} />;
}
