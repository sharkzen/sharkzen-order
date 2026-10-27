"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(min-width: 1024px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** true เมื่อจอกว้างพอวางบิลไว้ข้างรายการโต๊ะ (ตอน SSR ถือเป็นจอใหญ่ แล้วปรับตามจริงหลัง hydrate) */
export function useIsDesktop() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => true,
  );
}
