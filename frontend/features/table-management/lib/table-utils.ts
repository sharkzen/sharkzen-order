import type {
  CreateSpec,
  DiningTable,
  EditValues,
  StatusFilter,
  TableSession,
} from "@/features/table-management/types";

export const MAX_CREATE = 50;

export const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "open", label: "เปิดอยู่" },
  { value: "closed", label: "ว่าง" },
];

interface Filters {
  query: string;
  zone: string;
  status: StatusFilter;
}

/** zone ว่าง = ทุกโซน */
export function filterTables(tables: DiningTable[], filters: Filters) {
  const query = filters.query.trim().toLowerCase();

  return tables.filter((table) => {
    if (filters.zone && table.zone !== filters.zone) return false;
    if (filters.status === "open" && !table.session) return false;
    if (filters.status === "closed" && table.session) return false;
    return !query || table.name.toLowerCase().includes(query);
  });
}

export function listZones(tables: DiningTable[]) {
  return [...new Set(tables.map((table) => table.zone))];
}

export function summarize(tables: DiningTable[]) {
  const open = tables.filter((table) => table.session).length;
  return { total: tables.length, open, closed: tables.length - open };
}

/** ลิงก์ที่ฝังใน QR ของโต๊ะ (token ถาวรต่อโต๊ะ ใช้สั่งได้เมื่อโต๊ะมีรอบที่เปิดอยู่เท่านั้น) */
export function tableLink(table: DiningTable, origin: string) {
  return `${origin}/t/${table.token}`;
}

const SESSION_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** รหัสรอบแบบอ่านง่าย ไม่มีตัวที่สับสน (0/O, 1/I/L) เช่น S-7K3Q ของจริงให้ server สร้าง */
export function createSession(): TableSession {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const code = Array.from(
    bytes,
    (b) => SESSION_CHARS[b % SESSION_CHARS.length],
  ).join("");
  return { id: `S-${code}`, openedAt: Date.now() };
}

/** ข้อความเวลาที่เปิดมา เช่น "5 นาที" / "1 ชม. 20 นาที" */
export function formatElapsed(openedAt: number, now: number) {
  const minutes = Math.max(0, Math.floor((now - openedAt) / 60_000));
  if (minutes < 1) return "เพิ่งเปิด";
  if (minutes < 60) return `${minutes} นาที`;
  const rest = minutes % 60;
  return rest
    ? `${Math.floor(minutes / 60)} ชม. ${rest} นาที`
    : `${minutes / 60} ชม.`;
}

/** ชื่อโต๊ะทั้งหมดที่จะสร้างจากข้อมูลในฟอร์ม */
export function namesFor(spec: Pick<CreateSpec, "prefix" | "start" | "count">) {
  const count = Number.isInteger(spec.count) ? Math.max(0, spec.count) : 0;
  return Array.from({ length: Math.min(count, MAX_CREATE) }, (_, i) =>
    `${spec.prefix.trim()} ${spec.start + i}`.trim(),
  );
}

/** เลขโต๊ะถัดไปที่ยังว่าง ใช้เป็นค่าเริ่มต้นตอนสร้างโต๊ะ */
export function nextNumber(tables: DiningTable[]) {
  const numbers = tables.map((t) => Number(t.name.match(/(\d+)\s*$/)?.[1]));
  return Math.max(0, ...numbers.filter(Number.isFinite)) + 1;
}

type Errors<T> = Partial<Record<keyof T, string>>;

function checkCommon(zone: string, seats: number) {
  const errors: { zone?: string; seats?: string } = {};
  if (!zone) errors.zone = "กรุณาระบุโซน";
  if (!Number.isInteger(seats) || seats < 1 || seats > 30)
    errors.seats = "จำนวนที่นั่งต้องอยู่ระหว่าง 1–30";
  return errors;
}

export function validateCreate(
  spec: CreateSpec,
  tables: DiningTable[],
): Errors<CreateSpec> {
  const errors: Errors<CreateSpec> = checkCommon(spec.zone, spec.seats);
  if (!spec.prefix.trim()) errors.prefix = "กรุณากรอกคำนำหน้า เช่น โต๊ะ";
  if (!Number.isInteger(spec.start) || spec.start < 1)
    errors.start = "เลขเริ่มต้นต้องเป็นเลขตั้งแต่ 1";
  if (
    !Number.isInteger(spec.count) ||
    spec.count < 1 ||
    spec.count > MAX_CREATE
  )
    errors.count = `สร้างได้ครั้งละ 1–${MAX_CREATE} โต๊ะ`;

  if (!errors.prefix && !errors.start && !errors.count) {
    const taken = new Set(tables.map((t) => t.name));
    const clash = namesFor(spec).find((name) => taken.has(name));
    if (clash) errors.start = `มี "${clash}" อยู่แล้ว ลองเปลี่ยนเลขเริ่มต้น`;
  }
  return errors;
}

export function validateEdit(
  values: EditValues,
  tables: DiningTable[],
  editingId: string,
): Errors<EditValues> {
  const errors: Errors<EditValues> = checkCommon(values.zone, values.seats);
  if (!values.name) errors.name = "กรุณากรอกชื่อโต๊ะ";
  else if (tables.some((t) => t.id !== editingId && t.name === values.name))
    errors.name = "มีโต๊ะชื่อนี้อยู่แล้ว";
  return errors;
}
