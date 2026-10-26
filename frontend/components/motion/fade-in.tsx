"use client";

import type { ReactNode } from "react";
import { m } from "framer-motion";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/** แสดงเนื้อหาแบบค่อยๆ ปรากฏเมื่อเลื่อนมาถึง (ใช้กับส่วนที่อยู่ใต้ fold เท่านั้น) */
export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </m.div>
  );
}
