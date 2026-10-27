/** ตัดตัวที่อ่านสับสนออก (0/O, 1/l/I) เพื่อให้เจ้าของร้านอ่านรหัสให้พนักงานฟังได้ไม่พลาด */
const CHARSET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** สุ่มรหัสผ่าน 10 ตัวอักษร (เรียกจาก event handler ฝั่ง client เท่านั้น) */
export function generatePassword(length = 10) {
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (byte) => CHARSET[byte % CHARSET.length]).join("");
}

export const MIN_PASSWORD_LENGTH = 8;

/** คืนข้อความ error หรือสตริงว่างเมื่อรหัสผ่านใช้ได้ */
export function checkPassword(password: string) {
  if (!password) return "ตั้งรหัสผ่านให้พนักงาน";
  if (password.length < MIN_PASSWORD_LENGTH)
    return `รหัสผ่านต้องยาวอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    return "รหัสผ่านต้องมีทั้งตัวอักษรและตัวเลข";
  return "";
}

export const USERNAME_PATTERN = /^[a-z0-9._]{4,20}$/;
