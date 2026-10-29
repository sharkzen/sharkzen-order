"use client";

import { CreditCard, QrCode } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import { findPlan } from "@/features/landing/data";
import { useCatalog } from "@/features/pricing/lib/catalog";
import type { BillingOverview } from "@/features/billing/lib/billing-api";
import { describeStatus } from "@/features/billing/lib/plan-status";

interface CurrentPlanCardProps {
  overview: BillingOverview;
  now: number;
  busy: boolean;
  onSubscribe: () => void;
  /** ต่ออายุแพ็กเกจที่จ่ายด้วยพร้อมเพย์ */
  onRenew: () => void;
  /** เปลี่ยนจากพร้อมเพย์เป็นตัดบัตรอัตโนมัติ */
  onUseCard: () => void;
  onPortal: () => void;
  onCancel: () => void;
  onResume: () => void;
}

/** แพ็กเกจของฉัน: ชื่อแพ็กเกจ สถานะ วันที่สำคัญ และปุ่มที่ต้องกดต่อตามสถานะ */
export function CurrentPlanCard({ overview, now, busy, onSubscribe, onRenew, onUseCard, onPortal, onCancel, onResume }: CurrentPlanCardProps) {
  const { subscription: sub } = overview;
  const catalog = useCatalog();
  const trialDays = catalog?.trialDays ?? 0;
  const plan = findPlan(catalog, sub.plan);
  const status = describeStatus(sub, now, plan);
  const byPromptpay = sub.method === "promptpay" && !sub.autoRenew;
  const needsSubscribe = !sub.paying && !byPromptpay;
  const card = sub.autoRenew && sub.status !== "CANCELED";
  const progress =
    sub.status === "TRIALING" && !sub.paying && status.trialDaysLeft !== null && trialDays > 0
      ? Math.min(100, Math.max(0, ((trialDays - status.trialDaysLeft) / trialDays) * 100))
      : null;

  return (
    <Card className="flex flex-col gap-5 p-[22px]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-xs">แพ็กเกจของฉัน</p>
          <h2 className="font-display text-foreground text-[28px] leading-tight font-semibold">
            {plan?.name ?? "ยังไม่ได้เลือก"}
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              {sub.billing === "yearly" ? "รายปี" : "รายเดือน"}
            </span>
          </h2>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      {status.detail && <p className="text-muted-foreground text-[13px]">{status.detail}</p>}

      {progress !== null && (
        <div className="flex flex-col gap-1.5">
          <div className="bg-primary-soft h-2 overflow-hidden rounded-full">
            <div
              className={cn("h-full rounded-full", (status.trialDaysLeft ?? 0) <= 3 ? "bg-warning" : "bg-primary")}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-muted-foreground text-[11px]">
            ใช้ไป {trialDays - (status.trialDaysLeft ?? 0)} จาก {trialDays} วัน
          </p>
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-3">
        {needsSubscribe && (
          <Button onClick={onSubscribe} loading={busy}>
            {sub.status === "CANCELED" ? "สมัครใหม่" : "สมัครแพ็กเกจนี้"}
          </Button>
        )}
        {byPromptpay && (
          <>
            <Button onClick={onRenew} loading={busy}>
              <QrCode className="size-[18px]" aria-hidden />
              {sub.paying ? "ต่ออายุด้วยพร้อมเพย์" : "ต่ออายุ"}
            </Button>
            {sub.paying && (
              <Button variant="outline" onClick={onUseCard} disabled={busy}>
                <CreditCard className="size-[18px]" aria-hidden />
                ตัดบัตรอัตโนมัติ
              </Button>
            )}
          </>
        )}
        {card && (
          <Button variant={sub.status === "PAST_DUE" ? "primary" : "outline"} onClick={onPortal} loading={busy}>
            <CreditCard className="size-[18px]" aria-hidden />
            {sub.status === "PAST_DUE" ? "อัปเดตบัตร" : "จัดการบัตรและใบแจ้งหนี้"}
          </Button>
        )}
        {card && sub.cancelAtPeriodEnd && (
          <Button variant="outline" onClick={onResume} disabled={busy}>
            ต่ออายุแพ็กเกจ
          </Button>
        )}
        {card && !sub.cancelAtPeriodEnd && (
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            ยกเลิกแพ็กเกจ
          </Button>
        )}
      </div>
    </Card>
  );
}
