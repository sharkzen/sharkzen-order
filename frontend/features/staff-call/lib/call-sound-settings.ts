"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { ALERT_TONES, type AlertTone } from "@/features/kitchen-display/lib/sound";

export interface CallSoundSettings {
  /** เปิดเสียงเมื่อลูกค้าเรียกพนักงาน */
  enabled: boolean;
  /** ระดับเสียง 0–1 */
  volume: number;
  tone: AlertTone;
}

export const DEFAULT_CALL_SOUND: CallSoundSettings = {
  enabled: true,
  volume: 0.8,
  tone: "bell",
};

const KEY = "sharkzen-staff-call-sound";
const listeners = new Set<() => void>();
// เก็บค่าล่าสุดไว้ในหน่วยความจำด้วย เผื่อ localStorage ใช้ไม่ได้ (เช่นโหมดส่วนตัว)
let memory: string | null = null;

function readStored() {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) {
      memory = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function parse(raw: string): CallSoundSettings {
  if (!raw) return DEFAULT_CALL_SOUND;
  try {
    const value = JSON.parse(raw) as Partial<CallSoundSettings>;
    return {
      enabled: value.enabled ?? DEFAULT_CALL_SOUND.enabled,
      volume:
        typeof value.volume === "number"
          ? Math.min(1, Math.max(0, value.volume))
          : DEFAULT_CALL_SOUND.volume,
      tone: ALERT_TONES.some((t) => t.value === value.tone)
        ? (value.tone as AlertTone)
        : DEFAULT_CALL_SOUND.tone,
    };
  } catch {
    return DEFAULT_CALL_SOUND;
  }
}

/** อ่านค่าล่าสุดแบบไม่ผูกกับ React ใช้ใน event handler ของ socket */
export function readCallSound(): CallSoundSettings {
  return parse(memory ?? readStored());
}

/** ตั้งค่าเสียงเรียกพนักงาน จำไว้ในเครื่องนี้ (ฝั่ง server ใช้ค่าเริ่มต้นก่อน) */
export function useCallSoundSettings() {
  const raw = useSyncExternalStore(subscribe, () => memory ?? readStored(), () => "");
  const settings = useMemo(() => parse(raw), [raw]);

  const update = useCallback(
    (patch: Partial<CallSoundSettings>) => {
      const next = JSON.stringify({ ...settings, ...patch });
      memory = next;
      try {
        localStorage.setItem(KEY, next);
      } catch {
        // เก็บถาวรไม่ได้ ใช้ค่าในหน่วยความจำต่อจนกว่าจะปิดหน้า
      }
      listeners.forEach((listener) => listener());
    },
    [settings],
  );

  return [settings, update] as const;
}
