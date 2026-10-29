import { isIP } from "node:net";
import type { FastifyRequest } from "fastify";

/** IP ของผู้เรียก (ถ้าอยู่หลัง proxy ต้องตั้ง trustProxy ที่ Fastify ไม่งั้นจะเห็นเป็น IP ของ proxy) */
export const clientIp = (request: FastifyRequest) => request.ip;

const toBigInt = (ip: string) => {
  if (isIP(ip) === 4) return ip.split(".").reduce((n, part) => (n << 8n) + BigInt(part), 0n);
  // IPv6 แบบเต็ม: กระจาย :: แล้วรวม 8 กลุ่ม
  const [head = "", tail = ""] = ip.split("::");
  const a = head ? head.split(":") : [];
  const b = tail ? tail.split(":") : [];
  const groups = [...a, ...Array(8 - a.length - b.length).fill("0"), ...b];
  return groups.reduce((n, group) => (n << 16n) + BigInt(`0x${group || "0"}`), 0n);
};

const normalize = (ip: string) => (ip.startsWith("::ffff:") && isIP(ip.slice(7)) === 4 ? ip.slice(7) : ip);

/** ตรงกับรายการ IP/CIDR หรือไม่ รายการว่าง = ไม่จำกัด (เช่น ตอนพัฒนา) */
export function ipAllowed(ip: string, allowlist: string[]) {
  if (allowlist.length === 0) return true;
  const address = normalize(ip);
  const family = isIP(address);
  if (!family) return false;
  return allowlist.some((entry) => {
    const [base = "", bits] = entry.split("/");
    const rule = normalize(base.trim());
    if (isIP(rule) !== family) return false;
    const total = family === 4 ? 32 : 128;
    const prefix = bits === undefined ? total : Number(bits);
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > total) return false;
    const shift = BigInt(total - prefix);
    return toBigInt(address) >> shift === toBigInt(rule) >> shift;
  });
}
