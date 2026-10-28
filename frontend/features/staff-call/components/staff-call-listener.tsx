"use client";

import { useEffect } from "react";
import { toast } from "@/lib/toast";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { SocketEvent } from "@/lib/socket";
import type { AppNotification } from "@/features/shop/lib/shop-api";
import { playAlert, unlockAudio } from "@/features/kitchen-display/lib/sound";
import { readCallSound } from "@/features/staff-call/lib/call-sound-settings";

/**
 * ฟังว่าลูกค้ากดเรียกพนักงานจากโต๊ะไหน แล้วเล่นเสียง + ขึ้น toast บอกโต๊ะ
 * วางไว้ในทุกหน้าของร้าน (แดชบอร์ดและหน้าจอครัว) ไม่แสดงอะไรบนหน้า
 */
export function StaffCallListener() {
  // เบราว์เซอร์ยอมเล่นเสียงหลังผู้ใช้แตะหน้าจอครั้งแรกเท่านั้น
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useSocketEvent<AppNotification>(SocketEvent.NotificationCreated, (item) => {
    if (item.type !== "STAFF_CALL") return;
    toast.warning(item.title, {
      description: item.body ? `${item.body} • กรุณาไปที่โต๊ะ` : "กรุณาไปที่โต๊ะ",
    });
    const { enabled, tone, volume } = readCallSound();
    if (enabled) playAlert(tone, volume);
  });

  return null;
}
