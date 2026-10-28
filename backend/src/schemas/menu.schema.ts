import { z } from "zod";

const id = z.string().min(1);
const name = z.string().trim().min(1, "กรุณากรอกชื่อ").max(80);

export const idParamsSchema = z.object({ id });

export const categoryBodySchema = z.object({ name, visible: z.boolean().optional() });

const optionSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().trim().min(1, "กรุณากรอกชื่อตัวเลือก").max(60),
  /** ราคาที่บวกเพิ่มจากราคาเมนู 0 = ฟรี */
  price: z.number().min(0, "ราคาต้องไม่ติดลบ").max(100_000),
  available: z.boolean().default(true),
});

/** กลุ่มตัวเลือกของเมนู: single = เลือกได้ข้อเดียว (เช่น ความเผ็ด เย็น/ปั่น) multiple = เลือกได้หลายข้อ (เช่น ท็อปปิ้ง) */
export const optionGroupSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().trim().min(1, "กรุณากรอกชื่อกลุ่มตัวเลือก").max(60),
  type: z.enum(["single", "multiple"]),
  required: z.boolean(),
  /** จำนวนที่เลือกได้สูงสุด (เฉพาะ multiple) null = ไม่จำกัด */
  max: z.number().int().min(1).max(30).nullable().default(null),
  options: z.array(optionSchema).min(1, "แต่ละกลุ่มต้องมีอย่างน้อย 1 ตัวเลือก").max(30),
});
export type OptionGroup = z.infer<typeof optionGroupSchema>;
export const optionGroupsSchema = z.array(optionGroupSchema).max(10, "เพิ่มกลุ่มตัวเลือกได้ไม่เกิน 10 กลุ่ม");

const menuItemShape = {
  name,
  description: z.string().trim().max(300),
  price: z.number().min(0, "ราคาต้องไม่ติดลบ").max(1_000_000),
  // URL รูปที่อัปโหลดผ่าน /uploads/image (service ตรวจว่าเป็นรูปของร้านนี้บน R2) ว่าง = ไม่มีรูป
  image: z.string().max(500),
  available: z.boolean(),
  categoryId: id.nullable(),
  optionGroups: optionGroupsSchema,
};

export const menuItemBodySchema = z.object({
  ...menuItemShape,
  description: menuItemShape.description.default(""),
  image: menuItemShape.image.default(""),
  available: menuItemShape.available.default(true),
  categoryId: menuItemShape.categoryId.default(null),
  optionGroups: menuItemShape.optionGroups.default([]),
});

/**
 * แก้ไขบางฟิลด์ (เช่น สลับพร้อมขาย) ต้องสร้างจาก shape ที่ไม่มี default
 * เพราะ zod 4 เติมค่า default ให้ฟิลด์ที่ไม่ได้ส่งแม้ใช้ partial() ทำให้หมวด รูป และรายละเอียดถูกล้างโดยไม่ตั้งใจ
 */
export const menuItemPatchSchema = z.object({ ...menuItemShape, featured: z.boolean() }).partial();

/** เมนูแนะนำได้ไม่เกินกี่เมนูต่อร้าน */
export const MAX_FEATURED = 4;

/** เพิ่มหลายเมนูในครั้งเดียว (เรียงตามลำดับที่ส่งมา) */
export const createItemsBodySchema = z.object({
  items: z.array(menuItemBodySchema).min(1, "ต้องมีอย่างน้อย 1 เมนู").max(50, "เพิ่มได้ครั้งละไม่เกิน 50 เมนู"),
});

/** deleteItems=true ลบเมนูทั้งหมดในหมวดด้วย (ไม่ส่ง = ย้ายเมนูไป "ไม่มีหมวดหมู่") */
export const deleteCategoryQuerySchema = z.object({
  deleteItems: z.enum(["true", "false"]).default("false"),
});

/** ลำดับหมวดหมู่ทั้งหมด (id เรียงจากบนลงล่าง) */
export const reorderCategoriesBodySchema = z.object({ ids: z.array(id).min(1) });

/** ลำดับเมนูในหมวดหนึ่ง (categoryId ว่าง = ไม่มีหมวด) เมนูที่ย้ายมาจากหมวดอื่นจะถูกเปลี่ยนหมวดตามไปด้วย */
export const reorderItemsBodySchema = z.object({
  categoryId: id.nullable(),
  ids: z.array(id),
});

export type CategoryBody = z.infer<typeof categoryBodySchema>;
export type MenuItemBody = z.infer<typeof menuItemBodySchema>;
export type MenuItemPatch = z.infer<typeof menuItemPatchSchema>;
