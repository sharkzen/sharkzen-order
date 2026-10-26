export interface LegalSection {
  title: string;
  /** ย่อหน้าเนื้อหา */
  paragraphs?: string[];
  /** รายการย่อย */
  items?: string[];
}

export interface LegalDocument {
  title: string;
  description: string;
  sections: LegalSection[];
}

/** วันที่ปรับปรุงเอกสารล่าสุด */
export const LEGAL_UPDATED = "26 ตุลาคม 2569";

/** ช่องทางติดต่อตัวอย่าง — แทนที่ด้วยข้อมูลจริงของบริษัทก่อนเปิดใช้งาน */
export const LEGAL_CONTACT = {
  email: "privacy@sharkzen-order.example",
  phone: "02-123-4567",
} as const;
