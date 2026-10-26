import {
  BellRing,
  ScanLine,
  Store,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface Step {
  icon: LucideIcon;
  title: string;
  text: string;
}

export const STEPS: Step[] = [
  {
    icon: Store,
    title: "จัดร้านให้พร้อม",
    text: "เพิ่มเมนู ตั้งค่าโต๊ะ และพิมพ์คิวอาร์โค้ดประจำโต๊ะ",
  },
  {
    icon: ScanLine,
    title: "ลูกค้าสแกนแล้วสั่ง",
    text: "เปิดเมนูผ่านมือถือ เลือกอาหารและระบุความต้องการ",
  },
  {
    icon: BellRing,
    title: "ครัวทำ หน้าร้านเสิร์ฟ",
    text: "รับงานในหน้าจอครัว อัปเดตสถานะ แล้วส่งต่อความอร่อย",
  },
  {
    icon: Wallet,
    title: "รับเงิน ปิดบิล",
    text: "เลือกช่องทางชำระเงิน ระบบสรุปยอดแยกตามช่องทางให้เอง",
  },
];
