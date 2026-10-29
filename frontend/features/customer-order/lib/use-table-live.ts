"use client";

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { env } from "@/config/env";

/** ตรงกับ SocketEvent.TableChanged ใน backend/src/sockets/events.ts */
const TABLE_CHANGED = "table:changed";
/** กันเหตุการณ์ที่มาติดกันเป็นชุด (เช่น ครัวเปลี่ยนหลายใบพร้อมกัน) ให้โหลดครั้งเดียว */
const COALESCE_MS = 200;
/** ตาข่ายนิรภัย: ถ้า socket หลุดนานหรือพลาด event ก็ยังโหลดใหม่เป็นระยะ (ช้ากว่าเดิมมาก) */
const FALLBACK_MS = 60_000;

/**
 * ให้หน้าลูกค้าอัปเดตทันทีเมื่อมีอะไรเปลี่ยนที่โต๊ะ (ครัวรับ/เสร็จ/ยกเลิก พนักงานเปิด-ปิดโต๊ะ)
 * socket ส่งแค่สัญญาณ "มีการเปลี่ยนแปลง" ไม่มีข้อมูลออเดอร์ แล้ว onChange โหลดข้อมูลจริงผ่าน REST ที่ตรวจตั๋วรอบ
 * เชื่อมต่อด้วย token ของโต๊ะจาก QR จึงเข้าได้เฉพาะห้องโต๊ะนี้
 */
export function useTableLive(token: string, onChange: () => void) {
  const handler = useRef(onChange);
  useEffect(() => {
    handler.current = onChange;
  });

  useEffect(() => {
    const socket = io(env.socketUrl, { auth: { table: token } });
    let timer: ReturnType<typeof setTimeout> | undefined;
    const trigger = () => {
      clearTimeout(timer);
      timer = setTimeout(() => handler.current(), COALESCE_MS);
    };
    socket.on(TABLE_CHANGED, trigger);
    // เชื่อมต่อใหม่หลังหลุด: อาจพลาด event ระหว่างนั้น โหลดซ้ำหนึ่งครั้ง (ครั้งแรกที่ต่อติดไม่ต้อง หน้าโหลดเองอยู่แล้ว)
    let connectedBefore = false;
    socket.on("connect", () => {
      if (connectedBefore) trigger();
      connectedBefore = true;
    });
    // กลับมาเปิดหน้าจอ (มือถือพักจอ) แล้วโหลดทันที
    const onVisible = () => {
      if (document.visibilityState === "visible") trigger();
    };
    document.addEventListener("visibilitychange", onVisible);
    const fallback = setInterval(() => {
      if (document.visibilityState === "visible") handler.current();
    }, FALLBACK_MS);

    return () => {
      clearTimeout(timer);
      clearInterval(fallback);
      document.removeEventListener("visibilitychange", onVisible);
      socket.disconnect();
    };
  }, [token]);
}
