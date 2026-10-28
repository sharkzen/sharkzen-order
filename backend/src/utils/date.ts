/** วันที่ทั้งหมดของระบบอ้างอิงเวลาไทย (UTC+7) ไม่มี DST */
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;

/** 00:00 ตามเวลาไทยของวันที่ YYYY-MM-DD */
export const startOfDay = (date: string) => new Date(Date.parse(`${date}T00:00:00Z`) - BANGKOK_OFFSET_MS);

/** เลื่อนวันที่ YYYY-MM-DD ไปกี่วัน */
export const shiftDate = (date: string, days: number) =>
  new Date(Date.parse(date) + days * DAY_MS).toISOString().slice(0, 10);

/** แปลงเวลาเป็นเวลาไทย แล้วใช้ getter แบบ UTC อ่านค่าได้เลย */
export const bangkok = (date: Date) => new Date(date.getTime() + BANGKOK_OFFSET_MS);

/** วันนี้ตามเวลาไทย YYYY-MM-DD */
export const todayBangkok = () => bangkok(new Date()).toISOString().slice(0, 10);
