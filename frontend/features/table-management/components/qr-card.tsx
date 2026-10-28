import { siteConfig } from "@/config/site";
import type { PrintSettings } from "@/features/table-management/lib/print-settings";
import type { DiningTable } from "@/features/table-management/types";
import { QrCode } from "./qr-code";

interface QrCardProps {
  table: DiningTable;
  link: string;
  settings: PrintSettings;
  /** สัดส่วน กว้าง/สูง ของป้าย ใช้คำนวณให้เนื้อหาพอดีป้ายไม่ล้น */
  aspect: number;
}

const [BRAND_MAIN, ...BRAND_REST] = siteConfig.name.split(" ");

const FRAME_WIDTH = { none: 0, thin: 0.7, thick: 2 } as const;

/** ขนาดฐาน (หน่วย cqmin = % ของด้านสั้นของป้าย) QR กับชื่อโต๊ะเป็นพระเอก ที่เหลือเล็กและเงียบ */
const BASE = {
  headline: 6.5,
  subline: 4,
  name: 16,
  zone: 5,
  pad: 5,
  gap: 3.5,
  brandReserve: 6,
} as const;

/**
 * ป้าย QR หนึ่งใบ ใช้ทั้งตัวอย่างและตอนพิมพ์ให้หน้าตาตรงกัน
 * ขนาดทุกอย่างอิงด้านสั้นของป้าย (cqmin) จึงย่อ-ขยายตามกระดาษได้โดยสัดส่วนไม่เพี้ยน
 * ถ้าตั้งขนาดใหญ่จนล้นป้าย (เช่นป้ายทรงจัตุรัส) จะย่อทั้งชุดลงให้พอดีโดยอัตโนมัติ
 */
export function QrCard({ table, link, settings, aspect }: QrCardProps) {
  const { accent, textColor, qrSize, image, imageOpacity } = settings;
  const frameWidth = FRAME_WIDTH[settings.frame];
  const showHead = !!(settings.headline || settings.subline);
  const showText = settings.showName || settings.showZone;

  const headH =
    (settings.headline
      ? BASE.headline * (settings.headlineSize / 100) * 1.3
      : 0) + (settings.subline ? BASE.subline * 1.35 : 0);
  const textH =
    (settings.showName ? BASE.name * (settings.nameSize / 100) * 1.3 : 0) +
    (settings.showZone ? BASE.zone * 1.3 : 0);
  const blocks = 1 + Number(showHead) + Number(showText);
  const needed =
    (showHead ? headH : 0) +
    (showText ? textH : 0) +
    (qrSize + 4) +
    BASE.gap * (blocks - 1) +
    (BASE.pad + frameWidth) * 2 +
    BASE.brandReserve;
  const available = aspect < 1 ? 100 / aspect : 100;
  const fit = Math.min(1, available / needed);
  const u = (n: number) => `${n * fit}cqmin`;

  // แผ่นรองข้อความใช้สีเดียวกับพื้นหลังป้าย จึงกลืนกับพื้นแต่บังลายรูป
  const plate = settings.textPlate
    ? {
        backgroundColor: `${settings.background}e6`,
        padding: `${u(1.5)} ${u(4)}`,
        borderRadius: u(3),
      }
    : undefined;

  return (
    <div
      className="relative flex size-full flex-col items-center justify-center overflow-hidden text-center"
      style={{
        containerType: "size",
        gap: u(BASE.gap),
        padding: `${u(BASE.pad)} ${u(BASE.pad)} ${u(BASE.pad + BASE.brandReserve)}`,
        color: textColor,
        backgroundColor: settings.background,
        borderRadius: settings.rounded ? "5cqmin" : undefined,
        border:
          frameWidth > 0 ? `${frameWidth}cqmin solid ${accent}` : undefined,
        outline: settings.showCutLine ? "1px dashed #9ca3af" : undefined,
        outlineOffset: settings.showCutLine ? "-1px" : undefined,
      }}
    >
      {image && (
        // eslint-disable-next-line @next/next/no-img-element -- data URL จากการอัปโหลด ไม่ผ่าน next/image
        <img
          src={image}
          alt=""
          className="absolute inset-0 size-full object-cover"
          style={{ opacity: imageOpacity / 100 }}
        />
      )}

      {showHead && (
        <div
          className="relative flex min-h-0 flex-col items-center"
          style={{ gap: u(1), ...plate }}
        >
          {settings.headline && (
            <p
              className="font-semibold"
              style={{
                color: accent,
                fontSize: u(BASE.headline * (settings.headlineSize / 100)),
                lineHeight: 1.3,
              }}
            >
              {settings.headline}
            </p>
          )}
          {settings.subline && (
            <p
              style={{
                fontSize: u(BASE.subline),
                opacity: 0.75,
                lineHeight: 1.35,
              }}
            >
              {settings.subline}
            </p>
          )}
        </div>
      )}

      <QrCode
        value={link}
        label={`QR ${table.name}`}
        className="relative shrink-0 bg-white"
        style={{
          width: u(qrSize),
          height: u(qrSize),
          padding: u(2),
          borderRadius: u(3),
          border: settings.qrFrame ? `0.7cqmin solid ${accent}` : undefined,
        }}
      />

      {showText && (
        <div
          className="relative flex flex-col items-center"
          style={{ gap: u(0.5), ...plate }}
        >
          {settings.showName && (
            <p
              className="font-extrabold"
              style={{
                fontSize: u(BASE.name * (settings.nameSize / 100)),
                lineHeight: 1.3,
              }}
            >
              {table.name}
            </p>
          )}
          {settings.showZone && (
            <p
              style={{
                fontSize: u(BASE.zone),
                opacity: 0.75,
                lineHeight: 1.3,
              }}
            >
              {table.zone}
            </p>
          )}
        </div>
      )}

      <p
        className="absolute flex items-center"
        style={{
          right: `${3.5 + frameWidth}cqmin`,
          bottom: `${2.8 + frameWidth}cqmin`,
          gap: "1cqmin",
          fontSize: "max(2.5cqmin, 7px)",
          letterSpacing: "0.14em",
          opacity: 0.6,
        }}
      >
        <span
          aria-hidden
          style={{
            width: "1.7cqmin",
            height: "1.7cqmin",
            minWidth: "4px",
            minHeight: "4px",
            borderRadius: "0.5cqmin",
            backgroundColor: accent,
          }}
        />
        <span className="font-bold">{BRAND_MAIN}</span>
        <span className="font-light">{BRAND_REST.join(" ")}</span>
      </p>
    </div>
  );
}
