"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { ALERT_TONES, type AlertTone } from "./sound";

export interface SoundSettings {
  /** เปิดเสียงแจ้งเตือนออเดอร์ใหม่ */
  enabled: boolean;
  /** ระดับเสียง 0–1 */
  volume: number;
  tone: AlertTone;
  /** เล่นซ้ำเป็นระยะจนกว่าจะรับออเดอร์ใหม่ครบ */
  repeat: boolean;
  /** เปิดเสียงแจ้งเตือนเมื่อหน้าร้านยกเลิกงาน */
  cancelEnabled: boolean;
  /** เสียงตอนหน้าร้านยกเลิก แยกจากเสียงออเดอร์ใหม่ เพื่อให้ครัวแยกออกด้วยหู */
  cancelTone: AlertTone;
}

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  enabled: true,
  volume: 0.7,
  tone: "chime",
  repeat: true,
  cancelEnabled: true,
  cancelTone: "alarm",
};

const KEY = "sharkzen-kitchen-sound";
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

function getSnapshot() {
  return memory ?? readStored();
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

/** เสียงที่เคยบันทึกไว้แต่ไม่มีให้เลือกแล้ว ให้กลับไปใช้เสียงเริ่มต้น */
function validTone(value: unknown, fallback: AlertTone) {
  return ALERT_TONES.some((tone) => tone.value === value)
    ? (value as AlertTone)
    : fallback;
}

function parse(raw: string): SoundSettings {
  if (!raw) return DEFAULT_SOUND_SETTINGS;
  try {
    const value = JSON.parse(raw) as Partial<SoundSettings>;
    return {
      enabled: value.enabled ?? DEFAULT_SOUND_SETTINGS.enabled,
      volume:
        typeof value.volume === "number"
          ? Math.min(1, Math.max(0, value.volume))
          : DEFAULT_SOUND_SETTINGS.volume,
      tone: validTone(value.tone, DEFAULT_SOUND_SETTINGS.tone),
      repeat: value.repeat ?? DEFAULT_SOUND_SETTINGS.repeat,
      cancelEnabled:
        value.cancelEnabled ?? DEFAULT_SOUND_SETTINGS.cancelEnabled,
      cancelTone: validTone(
        value.cancelTone,
        DEFAULT_SOUND_SETTINGS.cancelTone,
      ),
    };
  } catch {
    return DEFAULT_SOUND_SETTINGS;
  }
}

/** ตั้งค่าเสียงของหน้าจอครัว จำไว้ในเครื่องนี้ (ฝั่ง server ใช้ค่าเริ่มต้นก่อน) */
export function useSoundSettings() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "");
  const settings = useMemo(() => parse(raw), [raw]);

  const update = useCallback(
    (patch: Partial<SoundSettings>) => {
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
