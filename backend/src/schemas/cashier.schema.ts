import { z } from "zod";

export const tableParamsSchema = z.object({ tableId: z.string().min(1) });

export const payBillBodySchema = z.object({
  method: z.enum(["CASH", "TRANSFER"]),
  /** ส่วนลดเป็นบาท (ฝั่ง server ตรวจไม่ให้เกินยอดรวม) */
  discount: z.number().min(0).default(0),
  /** เงินสดที่รับมา ใช้เมื่อ method = CASH */
  received: z.number().min(0).optional(),
});

export type PayBillBody = z.infer<typeof payBillBodySchema>;
