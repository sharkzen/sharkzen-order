"use client";

import { useEffect, useState } from "react";

/** ความสูงของ header ที่ติดอยู่บนสุด ใช้คำนวณเส้นอ้างอิงว่า section ไหนอยู่ตรงหน้า */
const HEADER_HEIGHT = 88;

/**
 * คืน id ของ section ที่ผู้ใช้กำลังดูอยู่ (ไล่ตามลำดับ ids)
 * - section ที่เลยเส้นอ้างอิง (ใต้ header ลงมา 30% ของจอ) ไปแล้วล่าสุดจะเป็นตัวที่ active
 * - เลื่อนสุดหน้าแล้ว ตัวสุดท้ายจะ active เสมอ
 * - section ที่ไม่มีในเมนู (เช่น ตัวอย่างระบบ) จะนับรวมกับเมนูที่อยู่ก่อนหน้า
 */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const line = HEADER_HEIGHT + window.innerHeight * 0.3;
      let current = ids[0];

      for (const id of ids) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= line)
          current = id;
      }

      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      setActive(atBottom ? ids[ids.length - 1] : current);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [ids]);

  return active;
}
