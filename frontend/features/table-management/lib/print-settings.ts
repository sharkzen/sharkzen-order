export type PaperId = "a4" | "a5" | "a6" | "letter" | "custom";
export type PerPage = 1 | 2 | 4 | 6 | 8 | 9;

/** ตั้งค่าหน้าตาป้าย QR และกระดาษ เจ้าของร้านปรับได้ให้ตรงกับเครื่องพิมพ์ของตัวเอง */
export interface PrintSettings {
  paper: PaperId;
  landscape: boolean;
  /** ขนาดกระดาษเอง (มม.) ใช้เมื่อ paper = custom */
  customWidth: number;
  customHeight: number;
  perPage: PerPage;
  /** ขอบกระดาษ (มม.) */
  margin: number;
  headline: string;
  subline: string;
  showName: boolean;
  showZone: boolean;
  /** เส้นประรอบป้ายสำหรับใช้กรรไกรตัด */
  showCutLine: boolean;
  /** กรอบตกแต่งรอบป้าย (สีหลัก) */
  frame: "none" | "thin" | "thick";
  /** ทำมุมป้ายโค้งมน */
  rounded: boolean;
  /** กรอบสีรอบ QR */
  qrFrame: boolean;
  /** แผ่นรองข้อความ ช่วยให้อ่านง่ายเมื่อใช้รูปพื้นหลัง */
  textPlate: boolean;
  /** สีพื้นหลังป้าย (ใช้ร่วมกับรูปพื้นหลังได้) */
  background: string;
  /** สีข้อความชื่อโต๊ะ โซน และข้อความรอง */
  textColor: string;
  /** ขนาดหัวป้าย / ชื่อโต๊ะ เทียบกับค่าปกติ (%) */
  headlineSize: number;
  nameSize: number;
  /** สีหลักของข้อความหัวป้ายและกรอบ QR */
  accent: string;
  /** ขนาด QR เป็น % ของด้านสั้นของป้าย */
  qrSize: number;
  /** รูปพื้นหลัง (data URL) */
  image: string | null;
  /** ความเข้มของรูปพื้นหลัง (%) ยิ่งจางยิ่งสแกน QR ง่าย */
  imageOpacity: number;
}

export const DEFAULT_SETTINGS: PrintSettings = {
  paper: "a4",
  landscape: false,
  customWidth: 100,
  customHeight: 150,
  perPage: 6,
  margin: 8,
  headline: "สแกนเพื่อสั่งอาหาร",
  subline: "",
  showName: true,
  showZone: true,
  showCutLine: false,
  frame: "none",
  rounded: false,
  qrFrame: false,
  textPlate: false,
  background: "#ffffff",
  textColor: "#111827",
  headlineSize: 100,
  nameSize: 100,
  accent: "#1d4ed8",
  qrSize: 62,
  image: null,
  imageOpacity: 25,
};

/** ขนาดกระดาษแนวตั้ง (มม.) */
export const PAPERS: Record<
  Exclude<PaperId, "custom">,
  { label: string; width: number; height: number }
> = {
  a4: { label: "A4", width: 210, height: 297 },
  a5: { label: "A5", width: 148, height: 210 },
  a6: { label: "A6", width: 105, height: 148 },
  letter: { label: "Letter", width: 216, height: 279 },
};

export const PER_PAGE_OPTIONS: PerPage[] = [1, 2, 4, 6, 8, 9];

/** แบบสำเร็จรูปแตะเดียว ปรับเฉพาะหน้าตา ไม่แตะข้อความ รูป และกระดาษ */
export const LOOKS: {
  id: string;
  label: string;
  patch: Partial<PrintSettings>;
}[] = [
  {
    id: "clean",
    label: "เรียบ",
    patch: {
      frame: "none",
      rounded: false,
      qrFrame: false,
      showCutLine: false,
      textPlate: false,
      background: "#ffffff",
      textColor: "#111827",
      accent: "#1d4ed8",
    },
  },
  {
    id: "framed",
    label: "มีกรอบ",
    patch: {
      frame: "thin",
      rounded: true,
      qrFrame: true,
      showCutLine: false,
      textPlate: false,
      background: "#ffffff",
      textColor: "#111827",
    },
  },
  {
    id: "dark",
    label: "เข้ม",
    patch: {
      frame: "none",
      rounded: false,
      qrFrame: false,
      showCutLine: false,
      background: "#111827",
      textColor: "#ffffff",
      accent: "#fbbf24",
    },
  },
];

export const BACKGROUNDS = [
  "#ffffff",
  "#f3f4f6",
  "#fef3c7",
  "#e0f2fe",
  "#111827",
];
export const TEXT_COLORS = ["#111827", "#4b5563", "#ffffff"];

export const ACCENTS = ["#1d4ed8", "#0f766e", "#b45309", "#be123c", "#1f2937"];

/** [คอลัมน์, แถว] ของกระดาษแนวตั้ง แนวนอนสลับกัน */
const GRIDS: Record<PerPage, [number, number]> = {
  1: [1, 1],
  2: [1, 2],
  4: [2, 2],
  6: [2, 3],
  8: [2, 4],
  9: [3, 3],
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

/** ขนาดกระดาษจริง (มม.) ตามชนิดและการวางแนว */
export function paperSize(s: PrintSettings) {
  const base =
    s.paper === "custom"
      ? {
          width: clamp(s.customWidth, 40, 500),
          height: clamp(s.customHeight, 40, 500),
        }
      : PAPERS[s.paper];
  return s.landscape && s.paper !== "custom"
    ? { width: base.height, height: base.width }
    : { width: base.width, height: base.height };
}

/** แบ่งหน้าเป็นช่อง: คืนจำนวนคอลัมน์/แถว และขนาดป้ายแต่ละใบ (มม.) */
export function pageLayout(s: PrintSettings) {
  const paper = paperSize(s);
  const landscape = paper.width > paper.height;
  const [c, r] = GRIDS[s.perPage];
  const cols = landscape ? r : c;
  const rows = landscape ? c : r;
  const margin = clamp(s.margin, 0, Math.min(paper.width, paper.height) / 4);
  const areaWidth = paper.width - margin * 2;
  const areaHeight = paper.height - margin * 2;
  return {
    paper,
    margin,
    cols,
    rows,
    areaWidth,
    areaHeight,
    cardWidth: areaWidth / cols,
    cardHeight: areaHeight / rows,
  };
}

const STORAGE_KEY = "sharkzen-order.qr-print";

/** อ่านค่าที่เคยตั้งไว้ในเครื่องนี้ (ใช้ค่าเริ่มต้นถ้าไม่มี/อ่านไม่ได้) เมื่อมี API ให้ย้ายไปเก็บที่ร้าน */
export function loadSettings(): PrintSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // เบราว์เซอร์บล็อกหรือข้อมูลเสีย: ใช้ค่าเริ่มต้น
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: PrintSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // พื้นที่เต็ม (เช่นรูปใหญ่) ไม่เป็นไร ยังพิมพ์ได้ แค่ไม่จำค่าไว้
  }
}
