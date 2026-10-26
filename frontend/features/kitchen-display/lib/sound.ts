export type AlertTone =
  | "chime"
  | "doorbell"
  | "ding"
  | "soft"
  | "phone"
  | "rise"
  | "bell"
  | "gong"
  | "xylophone"
  | "wood"
  | "coin"
  | "pulse"
  | "triple"
  | "alarm";

export type ToneGroup = "gentle" | "ring" | "loud";

interface Note {
  frequency: number;
  /** เวลาเริ่ม (วินาที) นับจากเริ่มเล่น */
  start: number;
  duration: number;
  /** ความดังสัมพัทธ์ของโน้ตนี้ 0–1 */
  level: number;
  type: OscillatorType;
}

export interface ToneOption {
  value: AlertTone;
  label: string;
  description: string;
  group: ToneGroup;
  notes: Note[];
}

export const TONE_GROUPS: { value: ToneGroup; label: string; hint: string }[] =
  [
    {
      value: "gentle",
      label: "เสียงนุ่ม",
      hint: "ฟังสบาย เหมาะกับครัวที่ไม่ดังมาก",
    },
    { value: "ring", label: "เสียงกริ๊งและระฆัง", hint: "ก้องชัด จำง่าย" },
    {
      value: "loud",
      label: "เสียงดังชัด",
      hint: "ทะลุเสียงเครื่องดูดควันและเตาไฟ",
    },
  ];

const note = (
  frequency: number,
  start: number,
  duration: number,
  type: OscillatorType = "sine",
  level = 1,
): Note => ({ frequency, start, duration, level, type });

/** เสียงแจ้งเตือนที่เลือกได้ สังเคราะห์ด้วย Web Audio จึงไม่ต้องใช้ไฟล์เสียง */
export const ALERT_TONES: ToneOption[] = [
  {
    value: "chime",
    label: "ติ๊งสองจังหวะ",
    description: "สองโน้ตไล่ขึ้น ฟังชัดไม่แหลม",
    group: "gentle",
    notes: [note(880, 0, 0.7), note(1318, 0.16, 0.8, "sine", 0.9)],
  },
  {
    value: "doorbell",
    label: "ดิ๊งด่อง",
    description: "เสียงออดหน้าบ้าน สองโน้ตไล่ลง",
    group: "gentle",
    notes: [note(659, 0, 0.9), note(523, 0.45, 1.1)],
  },
  {
    value: "ding",
    label: "ดิ้งเดียว",
    description: "โน้ตเดียวสั้น สะอาด ไม่รบกวน",
    group: "gentle",
    notes: [note(1568, 0, 1.1, "triangle"), note(3136, 0, 0.5, "sine", 0.25)],
  },
  {
    value: "soft",
    label: "คอร์ดนุ่ม",
    description: "สามโน้ตซ้อนกัน เสียงอบอุ่น",
    group: "gentle",
    notes: [
      note(523, 0, 1.2, "sine", 0.8),
      note(659, 0, 1.2, "sine", 0.7),
      note(784, 0, 1.2, "sine", 0.6),
    ],
  },
  {
    value: "phone",
    label: "แจ้งเตือนมือถือ",
    description: "สามโน้ตเร็ว คุ้นหูแบบแอป",
    group: "gentle",
    notes: [note(1047, 0, 0.14), note(1319, 0.1, 0.14), note(1568, 0.2, 0.5)],
  },
  {
    value: "rise",
    label: "ไล่ขึ้นสามโน้ต",
    description: "โด-มี-ซอล ไล่ขึ้นสดใส",
    group: "gentle",
    notes: [note(523, 0, 0.5), note(659, 0.16, 0.5), note(784, 0.32, 0.8)],
  },
  {
    value: "bell",
    label: "กระดิ่งโต๊ะ",
    description: "กริ๊งก้องยาว เหมือนกดกระดิ่งเรียก",
    group: "ring",
    notes: [
      note(1568, 0, 1.4, "triangle"),
      note(3136, 0, 0.9, "sine", 0.35),
      note(2349, 0, 1.1, "sine", 0.3),
    ],
  },
  {
    value: "gong",
    label: "ระฆังทุ้ม",
    description: "เสียงต่ำก้องนาน ได้ยินไกล",
    group: "ring",
    notes: [
      note(392, 0, 2.2, "sine"),
      note(784, 0, 1.2, "sine", 0.4),
      note(1176, 0, 0.7, "sine", 0.2),
    ],
  },
  {
    value: "xylophone",
    label: "ไซโลโฟน",
    description: "ไล่เสียงสั้น ๆ สนุก สดใส",
    group: "ring",
    notes: [
      note(784, 0, 0.35, "triangle"),
      note(988, 0.12, 0.35, "triangle"),
      note(1175, 0.24, 0.35, "triangle"),
      note(1568, 0.36, 0.6, "triangle"),
    ],
  },
  {
    value: "wood",
    label: "ป๊อกไม้",
    description: "เสียงเคาะสั้น แห้ง ฟังไม่เหนื่อย",
    group: "ring",
    notes: [
      note(440, 0, 0.18, "triangle"),
      note(880, 0, 0.1, "triangle", 0.5),
      note(440, 0.22, 0.18, "triangle"),
    ],
  },
  {
    value: "coin",
    label: "เหรียญ",
    description: "ติ๊ง-ติ๊ง แบบเกม ฟังชัดมาก",
    group: "ring",
    notes: [note(988, 0, 0.09, "square"), note(1319, 0.09, 0.5, "square")],
  },
  {
    value: "pulse",
    label: "บี๊บสามครั้ง",
    description: "สั้นสามครั้งติดกัน แทรกเสียงอื่นได้",
    group: "loud",
    notes: [
      note(1046, 0, 0.12, "square"),
      note(1046, 0.2, 0.12, "square"),
      note(1046, 0.4, 0.12, "square"),
    ],
  },
  {
    value: "triple",
    label: "ติ๊ดรัว",
    description: "สี่ครั้งถี่ ๆ เสียงสูง เรียกความสนใจ",
    group: "loud",
    notes: [
      note(1318, 0, 0.08, "square"),
      note(1318, 0.12, 0.08, "square"),
      note(1318, 0.24, 0.08, "square"),
      note(1318, 0.36, 0.08, "square"),
    ],
  },
  {
    value: "alarm",
    label: "ไซเรนสั้น",
    description: "สลับสูง-ต่ำ ดังที่สุด ใช้เมื่อครัวเสียงดังมาก",
    group: "loud",
    notes: [
      note(880, 0, 0.18, "square"),
      note(660, 0.18, 0.18, "square"),
      note(880, 0.36, 0.18, "square"),
      note(660, 0.54, 0.18, "square"),
    ],
  },
];

let context: AudioContext | null = null;

function getContext() {
  if (context) return context;
  const AudioContextClass =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) return null;
  context = new AudioContextClass();
  return context;
}

/** เบราว์เซอร์อนุญาตให้เล่นเสียงได้หลังผู้ใช้แตะหน้าจอครั้งแรก เรียกฟังก์ชันนี้จากการแตะนั้น */
export function unlockAudio() {
  try {
    const ctx = getContext();
    if (ctx && ctx.state === "suspended") void ctx.resume();
  } catch {
    // เบราว์เซอร์ไม่รองรับ ปล่อยผ่านโดยไม่แจ้ง error
  }
}

/** เล่นเสียงแจ้งเตือน volume 0–1 */
export function playAlert(tone: AlertTone, volume: number) {
  try {
    const ctx = getContext();
    const preset = ALERT_TONES.find((item) => item.value === tone);
    if (!ctx || !preset || volume <= 0) return;
    if (ctx.state === "suspended") void ctx.resume();

    const now = ctx.currentTime;
    // เพดาน 0.5 กันเสียงแตก (square wave ดังกว่า sine ที่ระดับเดียวกัน จึงลดลงอีก)
    const master = Math.min(volume, 1) * 0.5;

    for (const item of preset.notes) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const level = master * item.level * (item.type === "square" ? 0.35 : 1);
      const start = now + item.start;

      oscillator.type = item.type;
      oscillator.frequency.value = item.frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(
        Math.max(level, 0.0002),
        start + 0.012,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, start + item.duration);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + item.duration + 0.05);
    }
  } catch {
    // เล่นไม่ได้ (ถูกบล็อกหรือไม่รองรับ) ปล่อยผ่านโดยไม่แจ้ง error
  }
}
