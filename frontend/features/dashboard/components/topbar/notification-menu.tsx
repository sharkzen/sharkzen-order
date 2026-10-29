"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  BellRing,
  CircleCheck,
  CirclePause,
  ReceiptText,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Spinner } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useShop } from "@/features/shop/components/shop-provider";
import type { NotificationType } from "@/features/shop/lib/shop-api";

const ICONS: Record<NotificationType, { icon: LucideIcon; tone: string }> = {
  ORDER_NEW: { icon: ReceiptText, tone: "bg-primary-soft text-primary-strong" },
  ORDER_PAID: { icon: Wallet, tone: "bg-success-soft text-success-strong" },
  ORDER_CANCELLED: { icon: BellOff, tone: "bg-danger-soft text-danger-strong" },
  SHOP_STATUS: { icon: CirclePause, tone: "bg-warning-soft text-warning-strong" },
  SYSTEM: { icon: CircleCheck, tone: "bg-muted text-muted-foreground" },
  STAFF_CALL: { icon: BellRing, tone: "bg-warning-soft text-warning-strong" },
};

/** เวลาที่ผ่านมาแบบสั้น เช่น "เมื่อสักครู่" "5 นาทีที่แล้ว" */
function ago(iso: string, now: number) {
  const minutes = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "เมื่อสักครู่";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} ชั่วโมงที่แล้ว`;
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

/** กระดิ่งแจ้งเตือนของร้าน: เฉพาะเรื่องสำคัญ เช่น ลูกค้าเรียกพนักงาน การชำระเงิน การยกเลิก อัปเดตสดผ่าน Socket.IO */
export function NotificationMenu() {
  const router = useRouter();
  const {
    notifications,
    unread,
    markRead,
    markAllRead,
    hasMoreNotifications,
    loadingMoreNotifications,
    loadMoreNotifications,
  } = useShop();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      clearInterval(tick);
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={unread > 0 ? `การแจ้งเตือน ยังไม่อ่าน ${unread} รายการ` : "การแจ้งเตือน"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setNow(Date.now());
          setOpen((value) => !value);
        }}
        className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-primary/50 relative flex size-9 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <Bell className="size-5" aria-hidden />
        {unread > 0 && (
          <span className="bg-danger absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="การแจ้งเตือน"
          className="border-border bg-surface shadow-float fixed top-[68px] right-3 left-3 z-40 flex max-h-[min(70vh,520px)] flex-col overflow-hidden rounded-xl border sm:absolute sm:top-full sm:right-0 sm:left-auto sm:mt-2 sm:w-[380px]"
        >
          <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
            <p className="text-foreground text-sm font-semibold">การแจ้งเตือน</p>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unread === 0}
              className="text-primary-strong cursor-pointer text-xs font-medium hover:underline disabled:cursor-default disabled:opacity-40 disabled:hover:no-underline"
            >
              อ่านทั้งหมดแล้ว
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center gap-2 px-6 py-10 text-center text-[13px]">
              <BellOff className="size-6" aria-hidden />
              ยังไม่มีการแจ้งเตือน ลูกค้าเรียกพนักงานและเรื่องสำคัญจะแสดงที่นี่
            </div>
          ) : (
            <ul className="scroll-thin divide-border divide-y overflow-y-auto">
              {notifications.map((item) => {
                const { icon: Icon, tone } = ICONS[item.type];
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!item.read) markRead(item.id);
                        setOpen(false);
                        if (item.href) router.push(item.href);
                      }}
                      className={cn(
                        "hover:bg-muted focus-visible:bg-muted flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none",
                        !item.read && "bg-primary-soft/40",
                      )}
                    >
                      <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full", tone)}>
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-foreground text-[13px] font-semibold">{item.title}</span>
                        {item.body && <span className="text-muted-foreground text-xs">{item.body}</span>}
                        <span className="text-muted-foreground text-[11px]">{ago(item.createdAt, now)}</span>
                      </span>
                      {!item.read && (
                        <span aria-label="ยังไม่อ่าน" className="bg-primary mt-2 size-2 shrink-0 rounded-full" />
                      )}
                    </button>
                  </li>
                );
              })}
              {hasMoreNotifications && (
                <li className="p-2">
                  <button
                    type="button"
                    onClick={() => void loadMoreNotifications()}
                    disabled={loadingMoreNotifications}
                    className="text-primary-strong hover:bg-primary-soft focus-visible:ring-primary/50 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-default disabled:opacity-60"
                  >
                    {loadingMoreNotifications && <Spinner className="size-4" />}
                    แสดงเพิ่มเติม
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
