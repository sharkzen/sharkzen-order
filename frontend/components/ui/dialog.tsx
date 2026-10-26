"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  /** แสดงปุ่มปิด (กากบาท) มุมขวาบน */
  showClose?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * หน้าต่างป๊อปอัปพื้นฐาน ใช้ dialog ของเบราว์เซอร์ จึงได้การดักโฟกัสและปุ่ม Esc มาให้
 * กดพื้นหลังมืดนอกกล่องเพื่อปิดได้
 */
export function Dialog({
  open,
  title,
  onClose,
  showClose = true,
  className,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "bg-surface text-foreground shadow-float m-auto max-h-[92vh] w-[min(94vw,480px)] overflow-y-auto rounded-xl p-0 backdrop:bg-[#0a1d3a]/50",
        className,
      )}
    >
      <h2 id={titleId} className="sr-only">
        {title}
      </h2>
      {showClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิด"
          className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-primary/50 absolute top-3 right-3 z-10 flex size-9 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <X className="size-5" aria-hidden />
        </button>
      )}
      {open && children}
    </dialog>
  );
}
