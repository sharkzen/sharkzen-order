"use client";

import { useEffect } from "react";
import Image from "next/image";
import {
  PiArmchairFill,
  PiArrowLeftBold,
  PiBowlSteamFill,
  PiForkKnifeFill,
  PiShoppingCartSimpleBold,
} from "react-icons/pi";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui";
import { CartEmpty, CartFooter, CartLines, type CartPanelProps } from "./cart-panel";

interface CartPageProps extends CartPanelProps {
  open: boolean;
  tableName: string;
  onClose: () => void;
}

/**
 * หน้าตะกร้าเต็มจอ: ตรวจรายการ เขียนหมายเหตุของแต่ละเมนู แล้วค่อยกดส่งเข้าครัว
 * ปุ่มยืนยันติดล่างจอเสมอ จึงกดได้ทันทีโดยไม่ต้องเลื่อนไปสุดรายการ
 */
export function CartPage({ open, tableName, onClose, ...panel }: CartPageProps) {
  // ล็อกการเลื่อนของหน้าด้านหลังขณะเปิดตะกร้า และปิดด้วยปุ่ม Esc
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  const count = panel.lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <div role="dialog" aria-modal="true" aria-label="ตะกร้า" className="bg-background fixed inset-0 z-40 flex flex-col">
      <header className="bg-surface border-border border-b">
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center gap-3 px-4 md:px-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="กลับไปเลือกเมนู"
            className="border-border bg-surface text-primary-strong hover:bg-muted focus-visible:ring-primary/50 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <PiArrowLeftBold className="size-5" aria-hidden />
          </button>
          <Image src="/images/logo.svg" alt="" width={36} height={36} unoptimized className="shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="font-display text-foreground truncate text-[15px] leading-tight font-bold tracking-wide">
              {siteConfig.name}
            </span>
            <span className="text-muted-foreground truncate text-[11px]">สั่งปุ๊บ เด้งปั๊บ ถึงครัวทันที</span>
          </div>
          <span className="bg-primary text-primary-foreground flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold">
            <PiArmchairFill className="size-4" aria-hidden />
            {tableName}
          </span>
        </div>
      </header>

      <main className="scroll-thin flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-5 md:px-6">
          <div className="flex items-center gap-3">
            <span className="bg-primary text-primary-foreground flex size-12 shrink-0 items-center justify-center rounded-full">
              <PiShoppingCartSimpleBold className="size-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-foreground text-xl leading-tight font-bold">ตะกร้าของคุณ</h1>
              <p className="text-muted-foreground text-xs">ตรวจสอบรายการอาหารก่อนสั่ง</p>
            </div>
            {count > 0 && (
              <span className="bg-primary-soft text-primary-strong flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold">
                <PiBowlSteamFill className="size-4" aria-hidden />
                {count} รายการ
              </span>
            )}
          </div>
          {panel.lines.length === 0 ? (
            <div className="flex flex-col items-center gap-4">
              <CartEmpty />
              <Button variant="outline" onClick={onClose}>
                กลับไปเลือกเมนู
              </Button>
            </div>
          ) : (
            <CartLines
              lines={panel.lines}
              note={panel.note}
              onNote={panel.onNote}
              onLineNote={panel.onLineNote}
              onChange={panel.onChange}
            />
          )}
          {panel.lines.length > 0 && (
            <div className="bg-primary-soft flex items-center gap-3 rounded-2xl px-4 py-3.5">
              <span className="bg-primary text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-full">
                <PiForkKnifeFill className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-primary-strong text-sm font-bold">กดสั่งอาหารได้เลย เราจะเตรียมให้เร็วที่สุด</p>
                <p className="text-muted-foreground text-xs">ขอบคุณที่ใช้บริการเรา</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {panel.lines.length > 0 && (
        <footer className="bg-surface border-border shadow-float rounded-t-3xl border-t">
          <div className="mx-auto w-full max-w-2xl px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6">
            <CartFooter total={panel.total} count={count} submitting={panel.submitting} onSubmit={panel.onSubmit} />
          </div>
        </footer>
      )}
    </div>
  );
}
