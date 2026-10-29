import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** TOTP ตาม RFC 6238 (SHA-1, 6 หลัก, 30 วินาที) ใช้ได้กับ Google Authenticator / Authy / 1Password */
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;

export function generateTotpSecret() {
  return base32Encode(randomBytes(20));
}

function base32Encode(buffer: Buffer) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(text: string) {
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of text.replace(/=+$/, "").toUpperCase()) {
    const index = ALPHABET.indexOf(char);
    if (index < 0) throw new Error("invalid base32");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function totpAt(secret: string, timeMs: number) {
  const counter = Math.floor(timeMs / 1000 / STEP_SECONDS);
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", base32Decode(secret)).update(message).digest();
  const offset = hmac[hmac.length - 1]! & 15;
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 1_000_000).padStart(6, "0");
}

/** ตรวจรหัส 6 หลัก ยอมคลาดเคลื่อนของนาฬิกา ±1 ช่วง (30 วินาที) */
export function verifyTotp(secret: string, code: string, now = Date.now()) {
  if (!/^\d{6}$/.test(code)) return false;
  const given = Buffer.from(code);
  return [-1, 0, 1].some((drift) => {
    const expected = Buffer.from(totpAt(secret, now + drift * STEP_SECONDS * 1000));
    return timingSafeEqual(given, expected);
  });
}

/** ลิงก์ otpauth:// สำหรับสร้าง QR ให้แอป Authenticator สแกน */
export const totpUri = (secret: string, account: string, issuer = "SHARKZEN ORDER") =>
  `otpauth://totp/${encodeURIComponent(`${issuer}:${account}`)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=${STEP_SECONDS}`;
