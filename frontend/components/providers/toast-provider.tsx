"use client";

import { useEffect } from "react";
import { toast } from "sharkzen-toast";

/** ตั้งค่า default ของ toast ครั้งเดียวตอนเริ่มแอป (ไม่ render อะไร) */
export function ToastProvider() {
  useEffect(() => {
    toast.configure({ position: "top-center", duration: 4000, limit: 5 });
  }, []);

  return null;
}
