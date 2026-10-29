import { randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";
import { bangkok } from "@/utils/date.js";

/** ตัดตัวอ่านสับสนออก (0/O, 1/I) ให้พนักงานอ่านและพิมพ์รหัสจากใบเสร็จได้ถูก */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SUFFIX_LENGTH = 6;

/**
 * รหัสออเดอร์: SZ-<วันที่ไทย yyMMdd>-<ค่าสุ่ม 6 ตัว> เช่น SZ-261029-K7M2QX
 * วันที่ช่วยให้ตรวจย้อนหลังได้ ค่าสุ่ม (~10^9 แบบต่อวัน) ทำให้เดาหรือนับปริมาณออเดอร์ของระบบไม่ได้
 */
export function generateOrderCode(now = new Date()) {
  const day = bangkok(now).toISOString().slice(2, 10).replaceAll("-", "");
  const suffix = Array.from({ length: SUFFIX_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `SZ-${day}-${suffix}`;
}

/** ชนกับรหัสที่มีอยู่แล้ว (unique constraint ของ Order.code) */
export const isCodeCollision = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002" &&
  String(error.meta?.target ?? "").includes("code");
