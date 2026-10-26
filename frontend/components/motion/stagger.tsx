"use client";

import type { ComponentProps } from "react";
import { m, type Variants } from "framer-motion";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

/** กลุ่มที่ลูกๆ (StaggerItem) ค่อยๆ ปรากฏทีละตัวเมื่อเลื่อนมาถึง */
export function Stagger(props: ComponentProps<typeof m.ol>) {
  return (
    <m.ol
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      {...props}
    />
  );
}

export function StaggerItem(props: ComponentProps<typeof m.li>) {
  return <m.li variants={item} {...props} />;
}
