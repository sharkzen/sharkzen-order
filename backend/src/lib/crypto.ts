import { createHmac, randomBytes, randomInt, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import argon2 from "argon2";
import { env } from "@/config/env.js";

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 64 * 1024,
  timeCost: 3,
  parallelism: 1,
} as const;

// รูปแบบเดิม "salt:key" (scrypt) ยังตรวจได้ เพื่อให้บัญชีเก่าล็อกอินได้แล้วค่อยอัปเกรดเป็น argon2id
const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

export const hashPassword = (password: string) => argon2.hash(password, ARGON2_OPTIONS);

async function verifyLegacyScrypt(password: string, stored: string) {
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), KEY_LENGTH);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** ตรวจรหัสผ่าน และบอกว่า hash ที่เก็บอยู่ควรถูกคำนวณใหม่ (scrypt เดิม หรือพารามิเตอร์ argon2 เก่า) */
export async function verifyPassword(password: string, stored: string) {
  if (!stored.startsWith("$argon2")) {
    return {
      ok: await verifyLegacyScrypt(password, stored),
      needsRehash: true,
    };
  }
  const ok = await argon2.verify(stored, password).catch(() => false);
  return { ok, needsRehash: ok && argon2.needsRehash(stored, ARGON2_OPTIONS) };
}

/** OTP 6 หลัก (สุ่มด้วย CSPRNG) */
export const generateOtp = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

/** token แบบยาวสำหรับลิงก์รีเซ็ตรหัสผ่าน */
export const generateToken = () => randomBytes(32).toString("base64url");

/** hash ที่เก็บใน DB (OTP มีแค่ล้านค่า จึงต้องมี secret ผสมด้วย) */
export const hashCode = (code: string) =>
  createHmac("sha256", env.JWT_SECRET).update(code).digest("hex");

export function safeEqualHex(a: string, b: string) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}
