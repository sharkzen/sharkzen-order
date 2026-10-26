import type { SVGProps } from "react";

/**
 * หม้อที่มีไอน้ำลอยขึ้น ใช้แทนสถานะ "กำลังทำ"
 * ไอน้ำขยับด้วย CSS (.steam ใน globals.css) และหยุดเมื่อผู้ใช้ตั้งค่าลดการเคลื่อนไหว
 */
export function CookingPotIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M3 13h18" />
      <path d="M5 13v5a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-5" />
      <path className="steam" d="M9 9c-1.2-1.3 1.2-2.4 0-4" />
      <path className="steam steam-2" d="M12 9c-1.2-1.3 1.2-2.4 0-4" />
      <path className="steam steam-3" d="M15 9c-1.2-1.3 1.2-2.4 0-4" />
    </svg>
  );
}
