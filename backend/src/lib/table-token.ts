import { createCipheriv, createDecipheriv, createHmac, hkdfSync } from "node:crypto";
import { env } from "@/config/env.js";

const derive = (info: string) => Buffer.from(hkdfSync("sha256", env.JWT_SECRET, "", info, 32));
const encKey = derive("table-token:enc");
const ivKey = derive("table-token:iv");

const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const UUID_BYTES = 16;

/**
 * token ที่ฝังใน QR ของโต๊ะ: เข้ารหัส AES-256-GCM ของ (shopId + tableId)
 * IV สร้างจาก HMAC ของข้อมูล ทำให้โต๊ะเดิมได้ token เดิมเสมอ (QR ที่พิมพ์ไปแล้วไม่ต้องเปลี่ยน)
 * แต่ปลอมหรือแก้ไขไม่ได้ เพราะไม่มี secret (เปลี่ยน JWT_SECRET = QR เดิมใช้ไม่ได้ทั้งหมด)
 */
export function encodeTableToken(shopId: string, tableId: string) {
  const plain = Buffer.concat([Buffer.from(shopId.replace(/-/g, ""), "hex"), Buffer.from(tableId)]);
  const iv = createHmac("sha256", ivKey).update(plain).digest().subarray(0, IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", encKey, iv);
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

/** ถอด token กลับเป็นร้านและโต๊ะ คืน null เมื่อ token ผิดรูปแบบหรือถูกแก้ไข */
export function decodeTableToken(token: string) {
  try {
    const buffer = Buffer.from(token, "base64url");
    if (buffer.length <= IV_LENGTH + TAG_LENGTH + UUID_BYTES) return null;
    const decipher = createDecipheriv("aes-256-gcm", encKey, buffer.subarray(0, IV_LENGTH));
    decipher.setAuthTag(buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH));
    const plain = Buffer.concat([decipher.update(buffer.subarray(IV_LENGTH + TAG_LENGTH)), decipher.final()]);
    const hex = plain.subarray(0, UUID_BYTES).toString("hex");
    const shopId = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    return { shopId, tableId: plain.subarray(UUID_BYTES).toString() };
  } catch {
    return null;
  }
}
