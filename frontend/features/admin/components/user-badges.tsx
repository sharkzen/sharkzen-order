import { Ban, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui";
import type { AdminSubscription } from "../lib/admin-api";
import { STATUS_LABEL, STATUS_TONE } from "../lib/format";

/** ป้ายสถานะแพ็กเกจของผู้ใช้ (ไม่มี = ยังไม่เลือกแพ็กเกจ) */
export function SubscriptionBadge({ subscription }: { subscription: AdminSubscription | null }) {
  if (!subscription) return <Badge tone="neutral">ยังไม่เลือกแพ็กเกจ</Badge>;
  return <Badge tone={STATUS_TONE[subscription.status]}>{STATUS_LABEL[subscription.status]}</Badge>;
}

export function BannedBadge() {
  return (
    <Badge tone="danger">
      <Ban className="size-3.5" aria-hidden />
      ถูกแบน
    </Badge>
  );
}

export function SuspendedBadge() {
  return (
    <Badge tone="danger">
      <Ban className="size-3.5" aria-hidden />
      ถูกระงับ
    </Badge>
  );
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <Badge tone="success">
      <ShieldCheck className="size-3.5" aria-hidden />
      ยืนยันอีเมลแล้ว
    </Badge>
  ) : (
    <Badge tone="warning">ยังไม่ยืนยันอีเมล</Badge>
  );
}
