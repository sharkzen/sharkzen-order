export interface NavItem {
  /** id ของ section ปลายทางในหน้า (ใช้ไฮไลต์เมนูตามตำแหน่งที่เลื่อนอยู่) */
  id: string;
  href: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "home", href: "/", label: "หน้าแรก" },
  { id: "features", href: "#features", label: "ฟีเจอร์" },
  { id: "how-it-works", href: "#how-it-works", label: "วิธีใช้งาน" },
  { id: "pricing", href: "#pricing", label: "ราคา" },
  { id: "faq", href: "#faq", label: "คำถามที่พบบ่อย" },
];
