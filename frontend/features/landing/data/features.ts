import {
  ChartNoAxesCombined,
  ChefHat,
  QrCode,
  Users,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface Feature {
  id: string;
  icon: LucideIcon;
  title: string;
  text: string;
  /** กว้างกี่ช่อง จากทั้งหมด 6 ช่อง (บนจอใหญ่) */
  span: 2 | 3 | 4;
  /** เน้นการ์ดนี้ด้วยพื้นหลังสีหลักอ่อน (ใช้ได้ 1 ใบต่อชุด) */
  highlight?: boolean;
  /** ป้ายสั้นๆ เสริมใต้คำอธิบาย */
  tags?: string[];
}

export const FEATURES: Feature[] = [
  {
    id: "qr-order",
    icon: QrCode,
    title: "สแกน สั่ง ส่งถึงครัว",
    text: "ลูกค้าสแกนคิวอาร์โค้ดบนโต๊ะ ดูเมนู เลือกความอร่อย และสั่งได้ทันที ไม่ต้องดาวน์โหลดแอป",
    span: 4,
    tags: ["ไม่ต้องติดตั้งแอป", "ผูกกับโต๊ะอัตโนมัติ", "ระบุหมายเหตุได้ทุกจาน"],
  },
  {
    id: "kitchen",
    icon: ChefHat,
    title: "ครัวเห็นชัด ไม่ตกหล่น",
    text: "แยกออร์เดอร์ใหม่ กำลังทำ และพร้อมเสิร์ฟ พร้อมหมายเหตุพิเศษทุกจาน",
    span: 2,
  },
  {
    id: "payments",
    icon: Wallet,
    title: "รับเงินได้ทุกช่องทาง ปิดยอดได้ทันที",
    text: "บันทึกการชำระด้วยพร้อมเพย์ เงินสด บัตร หรือโอน แล้วสรุปยอดแยกตามช่องทางให้อัตโนมัติ ไม่ต้องนั่งรวมตอนปิดร้าน",
    span: 4,
    highlight: true,
  },
  {
    id: "reports",
    icon: ChartNoAxesCombined,
    title: "รู้ยอดขายได้ทุกวัน",
    text: "ดูรายได้ เมนูขายดี และสถานะโต๊ะ ช่วยให้ตัดสินใจได้จากข้อมูลจริง",
    span: 2,
  },
  {
    id: "menu",
    icon: Utensils,
    title: "ปรับเมนูได้ทันใจ",
    text: "เพิ่มรูป เปลี่ยนราคา หรือปิดเมนูที่หมด สะท้อนถึงหน้าสั่งอาหารทันที",
    span: 3,
  },
  {
    id: "team",
    icon: Users,
    title: "ทุกทีมทำงานเป็นหนึ่ง",
    text: "แบ่งสิทธิ์เจ้าของร้าน พนักงาน และครัว ให้เห็นข้อมูลที่จำเป็นกับหน้าที่",
    span: 3,
  },
];
