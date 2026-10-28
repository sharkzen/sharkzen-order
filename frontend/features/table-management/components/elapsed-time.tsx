"use client";

import { useEffect, useState } from "react";
import { formatElapsed } from "@/features/table-management/lib/table-utils";

/** เวลาที่โต๊ะเปิดมาแล้ว อัปเดตทุก 30 วินาที (ว่างไว้จนกว่าจะ mount เพื่อไม่ให้ SSR ไม่ตรงกัน) */
export function ElapsedTime({ openedAt }: { openedAt: number }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  return <>{now === null ? "" : formatElapsed(openedAt, now)}</>;
}
