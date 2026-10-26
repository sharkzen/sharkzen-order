"use client";

import { m } from "framer-motion";
import { cn } from "@/lib/cn";

interface RevenueBarProps {
  /** ความสูงเป็นเปอร์เซ็นต์ของพื้นที่กราฟ */
  heightPercent: number;
  highlight?: boolean;
  delay?: number;
}

/** แท่งรายได้หนึ่งช่วงเวลา ขยายขึ้นจากฐานเมื่อโหลดหน้า (กราฟอยู่ในหน้าจอแรก จึงไม่รอเลื่อนถึง) */
export function RevenueBar({
  heightPercent,
  highlight = false,
  delay = 0,
}: RevenueBarProps) {
  return (
    <m.div
      className={cn(
        "min-w-0 flex-1 origin-bottom rounded-t-[4px]",
        highlight ? "bg-primary" : "bg-primary-muted",
      )}
      style={{ height: `${heightPercent}%` }}
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}
