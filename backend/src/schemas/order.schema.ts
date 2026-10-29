import { z } from "zod";

export const orderStatusSchema = z.enum(["NEW", "PREPARING", "READY", "SERVED", "CANCELLED"]);

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ต้องเป็น YYYY-MM-DD");

export const orderIdParamsSchema = z.object({ id: z.string().min(1) });
export const orderItemParamsSchema = z.object({ id: z.string().min(1), itemId: z.string().min(1) });

/** from/to ว่าง = วันนี้ (เวลาไทย) active=true = เฉพาะออเดอร์ที่ยังไม่จบ ไม่สนวันที่ (หน้าจอครัว) */
export const listOrdersQuerySchema = z.object({
  status: orderStatusSchema.optional(),
  from: date.optional(),
  to: date.optional(),
  active: z.enum(["true", "false"]).optional(),
  /** หน้าจอครัว: ออเดอร์ที่ยังไม่จบ + ที่ถูกยกเลิกและครัวยังไม่กดรับทราบ */
  kitchen: z.enum(["true", "false"]).optional(),
  /** ค้นหาจากรหัสออเดอร์หรือชื่อโต๊ะ ข้ามทุกวัน (ไม่สนช่วงวันที่) ใช้ตรวจสอบย้อนหลัง */
  q: z.string().trim().min(1).max(40).optional(),
});

export const tokenParamsSchema = z.object({ token: z.string().min(20).max(300) });

/** เพดานต่อการกดสั่งหนึ่งครั้ง: ลูกค้าสั่งหลายรอบได้ แต่ครั้งเดียวไม่ควรใหญ่ผิดปกติ */
export const MAX_LINES = 30;
export const MAX_DISHES = 100;

/** ลูกค้าสั่งผ่าน QR: โต๊ะและร้านมาจาก token ใน URL ไม่รับ id จาก client */
const orderBodyShape = z.object({
  notes: z.array(z.string().max(200)).max(20).default([]),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().positive().max(99),
        /** id ตัวเลือกที่เลือก (ทุกกลุ่มรวมกัน) */
        options: z.array(z.string().min(1).max(40)).max(30).default([]),
        /** หมายเหตุของรายการนี้ */
        note: z.string().trim().max(200).default(""),
      }),
    )
    .min(1)
    .max(MAX_LINES, `สั่งได้ไม่เกิน ${MAX_LINES} รายการต่อครั้ง`),
});

export const orderItemsSchema = orderBodyShape.pick({ items: true });

export const createOrderBodySchema = orderBodyShape.refine((body) => body.items.reduce((sum, item) => sum + item.quantity, 0) <= MAX_DISHES, {
    message: `สั่งได้ไม่เกิน ${MAX_DISHES} จานต่อครั้ง ถ้าต้องการมากกว่านี้ให้สั่งเป็นหลายรอบ`,
    path: ["items"],
  });

export const updateOrderStatusBodySchema = z.object({ status: orderStatusSchema });

const reason = z.string().trim().min(1, "กรุณาระบุเหตุผล").max(200);

/** fromKitchen = ครัวเป็นคนยกเลิก: ยกเลิกออเดอร์ที่ชำระแล้วได้ (หน้าร้านต้องคืนเงิน) และถือว่าครัวรับทราบแล้ว */
export const cancelOrderBodySchema = z.object({ reason, fromKitchen: z.boolean().default(false) });

/** ตั้งจำนวนจานที่เหลือของรายการ (ลดถึง 0 ให้ใช้ยกเลิกรายการ) */
export const setItemQuantityBodySchema = z.object({ quantity: z.number().int().min(1).max(99) });

export const cancelItemBodySchema = z.object({
  quantity: z.number().int().positive(),
  reason,
  fromKitchen: z.boolean().default(false),
});

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;
