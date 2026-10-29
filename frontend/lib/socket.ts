"use client";

import { useSyncExternalStore } from "react";
import { io, type Socket } from "socket.io-client";
import { env } from "@/config/env";

/** ชื่อ event ที่ backend ส่ง (ตรงกับ backend/src/sockets/events.ts) */
export const SocketEvent = {
  OrderCreated: "order:created",
  OrderUpdated: "order:updated",
  ShopUpdated: "shop:updated",
  MenuChanged: "menu:changed",
  TablesChanged: "tables:changed",
  StaffChanged: "staff:changed",
  NotificationCreated: "notification:new",
  /** ผู้ดูแลระบบแบน/ระงับ/ปลดบัญชีหรือร้านนี้ ให้ตรวจสิทธิ์ใหม่ */
  AccessChanged: "access:changed",
} as const;

let socket: Socket | undefined;

/** socket ตัวเดียวทั้งแอป เชื่อมด้วย session cookie เดียวกับ REST แล้ว server จะจับเข้าห้องร้านเอง */
export function getSocket() {
  socket ??= io(env.socketUrl, { withCredentials: true });
  return socket;
}

/** ใช้บอกผู้ใช้ว่าข้อมูลหน้านี้ "สด" อยู่หรือไม่ (เชื่อม Socket.IO อยู่หรือเปล่า) */
export function useSocketConnected() {
  return useSyncExternalStore(
    (notify) => {
      const socket = getSocket();
      socket.on("connect", notify);
      socket.on("disconnect", notify);
      return () => {
        socket.off("connect", notify);
        socket.off("disconnect", notify);
      };
    },
    () => getSocket().connected,
    () => false,
  );
}
