import type { CSSProperties } from "react";
import qrcode from "qrcode-generator";

interface QrCodeProps {
  /** ข้อความ/ลิงก์ที่จะฝังใน QR */
  value: string;
  label: string;
  className?: string;
  style?: CSSProperties;
}

/** QR Code จริงที่สแกนได้ สร้างเป็น SVG (คม ไม่เบลอตอนพิมพ์) ระดับแก้ไขข้อผิดพลาด M */
export function QrCode({ value, label, className, style }: QrCodeProps) {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();
  const svg = qr.createSvgTag({ cellSize: 1, margin: 2, scalable: true });

  return (
    <div
      role="img"
      aria-label={label}
      className={className}
      style={style}
      // SVG สร้างจากไลบรารีด้วยข้อมูลของเราเอง ไม่มีข้อความจากผู้ใช้แทรกเป็น markup
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
