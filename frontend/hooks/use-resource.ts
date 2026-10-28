"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toApiError } from "@/lib/http/api-error";
import { useSocketEvent } from "@/hooks/use-socket-event";

interface Options {
  /** event จาก Socket.IO ที่ทำให้โหลดซ้ำเงียบๆ (ไม่กลับไปแสดง skeleton) */
  refetchOn?: string[];
  /** ค่าที่เปลี่ยนแล้วต้องโหลดใหม่ เช่น ตัวกรอง (ต้องเป็นค่าที่เทียบกันได้) */
  key?: string;
  /** รวม event ที่มาถี่ๆ ให้เหลือโหลดครั้งเดียว */
  debounceMs?: number;
}

/**
 * โหลดข้อมูลจาก API: loading = ยังไม่มีข้อมูลเลย (แสดง skeleton)
 * โหลดซ้ำจาก socket/reload จะคงข้อมูลเดิมไว้ ไม่กะพริบ
 */
export function useResource<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  { refetchOn = [], key = "", debounceMs = 250 }: Options = {},
) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string>();
  const [version, setVersion] = useState(0);
  const latestFetcher = useRef(fetcher);
  useEffect(() => {
    latestFetcher.current = fetcher;
  });

  useEffect(() => {
    const controller = new AbortController();
    latestFetcher
      .current(controller.signal)
      .then((next) => {
        setData(next);
        setError(undefined);
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted) setError(toApiError(e).message);
      });
    return () => controller.abort();
  }, [key, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  useSocketEvent(refetchOn, () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(reload, debounceMs);
  });

  return { data, setData, error, loading: data === undefined && !error, reload };
}
