/** รอบการใช้โต๊ะ: พนักงานเปิดโต๊ะ = สร้างรอบใหม่ ปิดโต๊ะ = จบรอบ */
export interface TableSession {
  /** รหัสรอบ ใช้แยกลูกค้าแต่ละกลุ่มที่นั่งโต๊ะเดียวกันคนละเวลา */
  id: string;
  /** เวลาเปิดโต๊ะ (epoch ms) */
  openedAt: number;
}

export interface DiningTable {
  /** รหัสถาวรของโต๊ะ ฝังอยู่ใน QR ที่ติดโต๊ะ จึงไม่เปลี่ยนแม้เปิด-ปิดโต๊ะ */
  id: string;
  /** ชื่อที่ลูกค้าและพนักงานเห็น เช่น "โต๊ะ 1" */
  name: string;
  zone: string;
  seats: number;
  /** มีค่า = เปิดโต๊ะอยู่ ลูกค้าสแกน QR แล้วสั่งได้, null = ยังไม่เปิด สั่งไม่ได้ */
  session: TableSession | null;
}

export type StatusFilter = "all" | "open" | "closed";

/** ข้อมูลสร้างโต๊ะ: ได้หลายโต๊ะต่อเนื่อง เช่น โต๊ะ 11 ถึง โต๊ะ 20 */
export interface CreateSpec {
  prefix: string;
  start: number;
  count: number;
  zone: string;
  seats: number;
}

export interface EditValues {
  name: string;
  zone: string;
  seats: number;
}
