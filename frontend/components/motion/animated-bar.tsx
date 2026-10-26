"use client";

import type { CSSProperties } from "react";
import { m } from "framer-motion";

interface AnimatedBarProps {
  /** y = แท่งโตขึ้นจากฐานล่าง, x = แท่งโตจากซ้ายไปขวา */
  axis?: "x" | "y";
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

/** แท่งกราฟที่ขยายออกเมื่อเลื่อนมาถึง ขนาดจริงกำหนดผ่าน className/style */
export function AnimatedBar({
  axis = "y",
  delay = 0,
  className,
  style,
}: AnimatedBarProps) {
  const from = axis === "y" ? { scaleY: 0 } : { scaleX: 0 };
  const to = axis === "y" ? { scaleY: 1 } : { scaleX: 1 };

  return (
    <m.div
      className={className}
      style={{ ...style, transformOrigin: axis === "y" ? "bottom" : "left" }}
      initial={from}
      whileInView={to}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}
