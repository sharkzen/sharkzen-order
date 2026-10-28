"use client";

import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket";

/** ฟัง event ของร้านจาก Socket.IO ตลอดที่คอมโพเนนต์ยังอยู่ (handler ล่าสุดถูกเรียกเสมอ) */
export function useSocketEvent<T = unknown>(
  events: string | string[],
  handler: (payload: T) => void,
) {
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });

  const key = Array.isArray(events) ? events.join("|") : events;
  useEffect(() => {
    const socket = getSocket();
    const names = key.split("|").filter(Boolean);
    const listener = (payload: T) => latest.current(payload);
    for (const name of names) socket.on(name, listener);
    return () => {
      for (const name of names) socket.off(name, listener);
    };
  }, [key]);
}
