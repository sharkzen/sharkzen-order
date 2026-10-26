"use client";

import { useCallback, useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  document.addEventListener("fullscreenchange", onChange);
  return () => document.removeEventListener("fullscreenchange", onChange);
}

/** สลับโหมดเต็มหน้าจอของทั้งหน้า และบอกว่าตอนนี้เต็มจออยู่หรือไม่ */
export function useFullscreen() {
  const active = useSyncExternalStore(
    subscribe,
    () => document.fullscreenElement !== null,
    () => false,
  );

  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // เบราว์เซอร์บางตัวไม่อนุญาต (เช่น iOS Safari) ปล่อยผ่านโดยไม่แจ้ง error
    }
  }, []);

  return { active, toggle };
}
