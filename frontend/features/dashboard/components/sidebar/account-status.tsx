"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck, CirclePause, Gem } from "lucide-react";
import { Badge } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { describeStatus } from "@/features/billing/lib/plan-status";
import { findPlan } from "@/features/landing/data";
import { useShop } from "@/features/shop/components/shop-provider";
import { cn } from "@/lib/cn";
import { clientHttp } from "@/lib/http/client";
import { notify } from "@/lib/toast";

/** สถานะร้าน แพ็กเกจ (กดไปหน้าแพ็กเกจ) และปุ่มออกจากระบบ ท้ายแถบนำทาง */
export function AccountStatus() {
  const router = useRouter();
  const { shop, subscription } = useShop();
  const [now] = useState(() => Date.now());
  const isOpen = shop?.isOpen ?? true;
  const status = subscription ? describeStatus(subscription, now) : undefined;
  const planName = subscription ? findPlan(subscription.plan)?.name : undefined;
  const alert = status?.tone === "danger" || status?.tone === "warning";

  async function logout() {
    try {
      await clientHttp.post("/auth/logout");
      router.replace(ROUTES.login);
    } catch (e) {
      notify.error(e);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2.5">
      <Badge tone={isOpen ? "success" : "danger"}>
        {isOpen ? <CircleCheck className="size-[13px]" aria-hidden /> : <CirclePause className="size-[13px]" aria-hidden />}
        {isOpen ? "ร้านเปิดรับออเดอร์" : "ร้านปิดรับออเดอร์"}
      </Badge>

      <Link
        href={ROUTES.plan}
        className={cn(
          "focus-visible:ring-primary/50 flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-[11px] leading-snug transition-colors focus-visible:ring-2 focus-visible:outline-none",
          alert ? "bg-warning-soft text-warning-strong hover:bg-warning-soft/70" : "bg-background text-muted-foreground hover:bg-primary-soft",
        )}
      >
        <Gem className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span className="flex flex-col">
          <span className="text-foreground font-semibold">{planName ? `แพ็กเกจ${planName}` : "ยังไม่ได้เลือกแพ็กเกจ"}</span>
          <span>{status?.label ?? "ดูแพ็กเกจ"}</span>
        </span>
      </Link>

      <button
        type="button"
        onClick={logout}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-primary/50 cursor-pointer rounded text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        ออกจากระบบ
      </button>
    </div>
  );
}
