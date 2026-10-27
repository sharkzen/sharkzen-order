import type { DiningTable } from "../types";

/**
 * ข้อมูลตัวอย่างสำหรับหน้าโต๊ะและคิวอาร์โค้ด (ข้อมูลสมมติ)
 * เมื่อมี API ให้แทนที่ด้วยข้อมูลจาก services/ โดยคง type DiningTable ไว้
 */
const MINUTE = 60_000;
const SESSIONS: Record<number, [id: string, minutesAgo: number]> = {
  1: ["K7M2", 48],
  4: ["Q9XD", 12],
  5: ["H3TA", 75],
  9: ["W6RN", 4],
};

export const TABLES: DiningTable[] = Array.from({ length: 14 }, (_, i) => {
  const n = i + 1;
  const open = SESSIONS[n];
  return {
    id: `demo${n}`,
    name: `โต๊ะ ${n}`,
    zone: n > 10 ? "โซนริมระเบียง" : n > 6 ? "ชั้น 2" : "ชั้น 1",
    seats: n % 3 === 0 ? 6 : n % 2 === 0 ? 4 : 2,
    session: open
      ? { id: `S-${open[0]}`, openedAt: Date.now() - open[1] * MINUTE }
      : null,
  };
});
