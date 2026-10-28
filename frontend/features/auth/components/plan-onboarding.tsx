"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, PageLoader } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import {
  DEFAULT_PLAN_ID,
  PRICING_PLANS,
  TRIAL_DAYS,
  findPlan,
  type BillingCycle,
  type PlanId,
} from "@/features/landing/data";
import { notify } from "@/lib/toast";
import { authApi } from "@/features/auth/lib/auth-api";
import { PlanPicker } from "./plan-picker";

// TODO: ชั่วคราว แสดง loader ตลอดเพื่อดูขนาด ตั้งเป็น false เมื่อเสร็จ
const PREVIEW_LOADER = false;

interface PlanOnboardingProps {
  /** ค่าที่เลือกมาจากหน้าแรก (ถ้ามี) ใช้เป็นค่าเริ่มต้น */
  initialPlan?: PlanId;
  initialBilling?: BillingCycle;
}

/** ขั้นเลือกแพ็กเกจหลังสมัครและยืนยันอีเมลแล้ว */
export function PlanOnboarding({ initialPlan, initialBilling }: PlanOnboardingProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [planId, setPlanId] = useState<PlanId>(initialPlan ?? DEFAULT_PLAN_ID);
  const [billing, setBilling] = useState<BillingCycle>(initialBilling ?? "yearly");
  const [saving, setSaving] = useState(false);

  // ต้องเข้าสู่ระบบแล้วเท่านั้น และถ้าเคยเลือกไว้ตอนสมัครให้ใช้ค่านั้น
  useEffect(() => {
    authApi
      .me()
      .then(({ data }) => {
        const { plan, billingCycle } = data.user;
        if (!initialPlan && findPlan(plan ?? undefined)) setPlanId(plan as PlanId);
        if (!initialBilling && billingCycle) {
          setBilling(billingCycle === "MONTHLY" ? "monthly" : "yearly");
        }
        setReady(true);
      })
      .catch(() => router.replace(ROUTES.login));
  }, [initialPlan, initialBilling, router]);

  async function confirm() {
    setSaving(true);
    try {
      await authApi.selectPlan(planId, billing);
      notify.success("เลือกแพ็กเกจแล้ว", `เริ่มทดลองใช้ฟรี ${TRIAL_DAYS} วัน`);
      router.push(ROUTES.dashboard);
    } catch (error) {
      notify.error(error);
    } finally {
      setSaving(false);
    }
  }

  const plan = findPlan(planId) ?? PRICING_PLANS[0];

  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      {(!ready || PREVIEW_LOADER) && <PageLoader />}
      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-display text-foreground text-2xl leading-tight font-semibold sm:text-3xl lg:text-4xl">
          เลือกแพ็กเกจที่เหมาะกับร้านคุณ
        </h1>
        <p className="text-muted-foreground mx-auto max-w-xl text-sm sm:text-base">
          ทดลองใช้ฟรี {TRIAL_DAYS} วัน ไม่ต้องใช้บัตรเครดิต เปลี่ยนแพ็กเกจได้ภายหลัง
        </p>
      </div>

      <PlanPicker
        plan={plan}
        billing={billing}
        onPlanChange={setPlanId}
        onBillingChange={setBilling}
        footer={
          <div className="flex flex-col items-center gap-3">
            <Button size="lg" className="h-[52px] w-full" loading={saving} onClick={confirm}>
              เริ่มทดลองใช้ฟรี
            </Button>
            <button
              type="button"
              onClick={() => router.push(ROUTES.dashboard)}
              className="text-muted-foreground hover:text-foreground cursor-pointer text-sm transition-colors"
            >
              ตัดสินใจภายหลัง
            </button>
          </div>
        }
      />
    </div>
  );
}
