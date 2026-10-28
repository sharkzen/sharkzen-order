import { z } from "zod";
import { orderStatusSchema } from "./order.schema.js";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ต้องเป็น YYYY-MM-DD");

/** ช่วงวันที่ตามเวลาไทย (รวมทั้งวันเริ่มและวันสิ้นสุด) */
export const dashboardQuerySchema = z
  .object({
    from: dateSchema,
    to: dateSchema,
    status: orderStatusSchema.optional(),
    payment: z.enum(["UNPAID", "PAID"]).optional(),
  })
  .refine((q) => q.from <= q.to, {
    message: "วันเริ่มต้องไม่เกินวันสิ้นสุด",
    path: ["to"],
  })
  .refine((q) => daysBetween(q.from, q.to) <= 366, {
    message: "เลือกช่วงเวลาได้ไม่เกิน 1 ปี",
    path: ["to"],
  });

export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1;
}

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
