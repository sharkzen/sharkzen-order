"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { Catalog } from "@/features/landing/data";
import { clientHttp } from "@/lib/http/client";

const STALE_MS = 60_000;

let current: Catalog | null = null;
let loadedAt = 0;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

function refresh() {
  if (inflight || (current && Date.now() - loadedAt < STALE_MS)) return;
  inflight = clientHttp
    .get<Catalog>("/public/plans")
    .then(({ data }) => {
      current = data;
      loadedAt = Date.now();
      listeners.forEach((listener) => listener());
    })
    .catch(() => undefined)
    .finally(() => {
      inflight = null;
    });
}

/**
 * ราคา/แพ็กเกจ/จำนวนวันทดลองจาก API (ข้อมูลชุดเดียวกับที่ใช้คิดเงินจริง) แคชร่วมกันทั้งแอป
 * initial = ข้อมูลที่ server ดึงมาแล้ว ใช้ตอน SSR เพื่อให้หน้ามีราคาตั้งแต่ HTML แรก
 * คืน null = ยังโหลดไม่เสร็จ (หรือโหลดไม่ได้)
 */
export function useCatalog(initial?: Catalog | null): Catalog | null {
  const live = useSyncExternalStore(subscribe, () => current, () => null);
  useEffect(refresh, []);
  return live ?? initial ?? null;
}
