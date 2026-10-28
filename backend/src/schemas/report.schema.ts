import { z } from "zod";

/** ช่วงรายงานย้อนหลังเป็นจำนวนวัน (นับรวมวันนี้) หน้ารายงานขอ 2 เท่าของช่วงที่ดูเพื่อเทียบกับช่วงก่อนหน้า */
export const reportQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(60).default(7),
});
export type ReportQuery = z.infer<typeof reportQuerySchema>;
