import { prisma } from "@/lib/prisma.js";
import { DEFAULT_TRIAL_DAYS } from "@/lib/plans.js";

/** ค่าตั้งระบบที่ผู้ดูแลแก้ได้ (เก็บเป็นข้อความในตาราง SystemSetting) */
export interface SystemSettings {
  trialDays: number;
  /** รายปีแถมฟรีกี่เดือน (แสดงในป้ายราคา) */
  yearlyFreeMonths: number;
  supportEmail: string;
  supportPhone: string;
  supportLine: string;
}

const DEFAULTS: SystemSettings = {
  trialDays: DEFAULT_TRIAL_DAYS,
  yearlyFreeMonths: 2,
  supportEmail: "support@sharkzen.app",
  supportPhone: "",
  supportLine: "",
};

let cache: SystemSettings = { ...DEFAULTS };

export async function loadSettings() {
  const rows = await prisma.systemSetting.findMany();
  const map = new Map(rows.map((row) => [row.key, row.value]));
  const days = Number(map.get("trialDays"));
  const free = Number(map.get("yearlyFreeMonths"));
  cache = {
    trialDays: Number.isInteger(days) && days >= 0 ? days : DEFAULTS.trialDays,
    yearlyFreeMonths: map.has("yearlyFreeMonths") && Number.isInteger(free) && free >= 0 && free <= 11 ? free : DEFAULTS.yearlyFreeMonths,
    supportEmail: map.get("supportEmail") ?? DEFAULTS.supportEmail,
    supportPhone: map.get("supportPhone") ?? DEFAULTS.supportPhone,
    supportLine: map.get("supportLine") ?? DEFAULTS.supportLine,
  };
  return cache;
}

export const getSettings = () => cache;

export async function saveSettings(patch: Partial<SystemSettings>) {
  await prisma.$transaction(
    Object.entries(patch).map(([key, value]) =>
      prisma.systemSetting.upsert({ where: { key }, create: { key, value: String(value) }, update: { value: String(value) } }),
    ),
  );
  return loadSettings();
}
