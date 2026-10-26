"use client";

import type { ReactNode } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";

/**
 * ครอบทั้งแอปครั้งเดียวที่ root layout
 * - LazyMotion: โหลดเฉพาะฟีเจอร์ animation พื้นฐาน (เล็กกว่า) ต้องใช้ `m` แทน `motion`
 * - reducedMotion="user": ผู้ใช้ที่ตั้งค่าลดการเคลื่อนไหวในระบบจะไม่เห็น animation แบบเลื่อน/ขยาย
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
