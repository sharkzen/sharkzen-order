import { z } from "zod";
import { orderItemsSchema } from "@/schemas/order.schema.js";

export const tableParamsSchema = z.object({ tableId: z.string().min(1) });

export const payBillBodySchema = z.object({
  method: z.enum(["CASH", "TRANSFER"]),
  /** ส่วนลดเป็นบาท (ฝั่ง server ตรวจไม่ให้เกินยอดรวม) */
  discount: z.number().min(0).default(0),
  /** เงินสดที่รับมา ใช้เมื่อ method = CASH */
  received: z.number().min(0).optional(),
});

/** แคชเชียร์เพิ่มเมนูให้โต๊ะ (ตัวเลือกส่งเป็น id เหมือนที่ลูกค้าสั่ง) */
export const addItemsBodySchema = orderItemsSchema;

export type PayBillBody = z.infer<typeof payBillBodySchema>;
