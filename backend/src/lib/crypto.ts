import { createHmac, randomBytes, randomInt, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { env } from "../config/env.js";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, KEY_LENGTH);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), KEY_LENGTH);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
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
