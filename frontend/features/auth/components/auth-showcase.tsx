"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { PhonePanel } from "@/features/landing/components/hero/phone-panel";
import { DEMO_TABLE } from "@/features/landing/data";
import type { AuthMode } from "../lib/auth-mode";
import { QrArt } from "./qr-art";

const COPY = {
  login: {
    title: "ยินดีต้อนรับกลับ\nออร์เดอร์รอคุณอยู่",
    description: "ดูออร์เดอร์จากทุกโต๊ะ หน้าจอครัว และยอดขายวันนี้ในที่เดียว",
  },
  register: {
    title: "ให้ทุกโต๊ะ\nสั่งอาหารได้เอง",
    description: "พิมพ์คิวอาร์โค้ดวางบนโต๊ะ ลูกค้าสแกนสั่งได้ตั้งแต่มื้อถัดไป",
  },
} as const;

const EASE = [0.22, 1, 0.36, 1] as const;

/** ฝั่งซ้ายของหน้าเข้าสู่ระบบ/สมัครสมาชิก ใช้ชิ้นส่วนเดียวกับ Hero หน้าแรกเพื่อให้เว็บต่อเนื่องกัน */
export function AuthShowcase({ mode }: { mode: AuthMode }) {
  const copy = COPY[mode];
  const [sent, setSent] = useState(false);

  // ช่วงเวลาเดียวที่ขยับเอง: ลูกค้ากดสั่งแล้วออร์เดอร์ส่งถึงครัว
  useEffect(() => {
    const timer = setTimeout(() => setSent(true), 1600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="hidden flex-col gap-12 lg:flex">
      <div className="min-h-[200px]">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={mode}
            className="flex flex-col gap-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <h2 className="font-display text-foreground text-[44px] leading-[1.25] font-semibold whitespace-pre-line">
              {copy.title}
            </h2>
            <p className="text-muted-foreground max-w-[540px] text-[17px]">
              {copy.description}
            </p>
          </m.div>
        </AnimatePresence>
      </div>

      <div className="relative h-[372px] w-full max-w-[520px]">
        <m.div
          className="absolute top-0 left-0 w-[270px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <PhonePanel sent={sent} />
        </m.div>

        {/* ป้ายคิวอาร์โค้ดตั้งโต๊ะ วางซ้อนข้างจอมือถือ */}
        <m.figure
          className="border-border bg-surface shadow-float absolute top-16 left-[258px] w-[214px] rounded-[20px] border p-4"
          initial={{ opacity: 0, y: -24, rotate: 9 }}
          animate={{ opacity: 1, y: 0, rotate: 4 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.25 }}
        >
          <figcaption className="font-display text-foreground text-[15px] font-semibold">
            สแกนเพื่อสั่งอาหาร
          </figcaption>
          <div className="bg-primary-soft text-primary-strong mt-3 rounded-xl p-3 [--qr-bg:var(--primary-soft)]">
            <QrArt className="aspect-square w-full" />
          </div>
          <div className="border-border mt-3 flex items-baseline justify-between border-t pt-2.5">
            <span className="text-muted-foreground text-xs">วางบนโต๊ะ</span>
            <span className="font-display text-foreground text-xl font-semibold">
              {DEMO_TABLE}
            </span>
          </div>
        </m.figure>
      </div>
    </div>
  );
}
