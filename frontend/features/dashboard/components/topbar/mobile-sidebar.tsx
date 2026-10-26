"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Menu, X } from "lucide-react";

/** ปุ่มเมนู + drawer แถบนำทางสำหรับจอเล็ก (เนื้อหาแถบส่งมาจาก Server Component ผ่าน children) */
export function MobileSidebar({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="เปิดเมนู"
        aria-expanded={open}
        className="border-border hover:bg-muted focus-visible:ring-primary/50 flex size-10 cursor-pointer items-center justify-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:outline-none lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <m.div
              className="absolute inset-0 bg-[#0a1d3a]/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <m.aside
              role="dialog"
              aria-modal="true"
              aria-label="เมนูจัดการร้าน"
              className="bg-surface shadow-float scroll-thin absolute inset-y-0 left-0 w-[272px] max-w-[85vw] overflow-y-auto"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              // กดลิงก์ในเมนูแล้วปิด drawer
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("a")) setOpen(false);
              }}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="ปิดเมนู"
                className="text-muted-foreground hover:text-foreground focus-visible:ring-primary/50 absolute top-4 right-3 flex size-9 cursor-pointer items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:outline-none"
              >
                <X className="size-5" aria-hidden />
              </button>
              {children}
            </m.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
