"use client";

import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
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
            className="text-foreground hover:bg-muted focus-visible:ring-primary/50 -ml-2 flex size-11 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
          <div className="min-w-0">
            <h1 className="font-display text-foreground text-lg leading-tight">ตะกร้าของคุณ</h1>
            <p className="text-muted-foreground text-xs">{tableName}</p>
          </div>
        </div>
      </header>

      <main className="scroll-thin flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-2xl px-4 py-5 md:px-6">
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
        </div>
      </main>

      {panel.lines.length > 0 && (
        <footer className="bg-surface border-border shadow-float border-t">
          <div className="mx-auto w-full max-w-2xl px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6">
            <CartFooter total={panel.total} count={count} submitting={panel.submitting} onSubmit={panel.onSubmit} />
          </div>
        </footer>
      )}
    </div>
  );
}
