"use client";

import { useEffect, useState } from "react";

interface Clock {
  /** เวลาปัจจุบัน (null จนกว่าจะ mount ฝั่ง client เพื่อไม่ให้ SSR ไม่ตรงกัน) */
  now: Date | null;
  /** จำนวนวินาทีที่นาฬิกาเดินมาตั้งแต่ mount ใช้คำนวณเวลารอของงาน */
  ticks: number;
}

/** นาฬิกาที่เดินทุกวินาที: คืนเวลาปัจจุบันและจำนวนวินาทีที่ผ่านไป */
export function useClock(): Clock {
  const [clock, setClock] = useState<Clock>({ now: null, ticks: 0 });

  useEffect(() => {
    const tick = () =>
      setClock((prev) => ({ now: new Date(), ticks: prev.ticks + 1 }));
    // ตั้งค่าเวลาแรกทันที (ผ่าน timeout เพื่อไม่ setState ตรงๆ ใน effect) แล้วเดินต่อทุกวินาที
    const first = setTimeout(() => setClock({ now: new Date(), ticks: 0 }), 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  return clock;
}
