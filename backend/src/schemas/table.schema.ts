import { z } from "zod";

const id = z.string().min(1);
const zone = z.string().trim().min(1, "กรุณาระบุโซน").max(40);
const seats = z.number().int().min(1).max(30);

export const MAX_CREATE = 50;

/** สร้างโต๊ะต่อเนื่อง เช่น โต๊ะ 11 ถึง โต๊ะ 20 */
export const createTablesBodySchema = z.object({
  prefix: z.string().trim().min(1, "กรุณากรอกคำนำหน้า").max(30),
  start: z.number().int().min(1),
  count: z.number().int().min(1).max(MAX_CREATE),
  zone,
  seats,
});

export const updateTableBodySchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อโต๊ะ").max(40),
  zone,
  seats,
});

export const deleteTablesBodySchema = z.object({ ids: z.array(id).min(1) });
export const reorderTablesBodySchema = z.object({ ids: z.array(id).min(1) });

export type CreateTablesBody = z.infer<typeof createTablesBodySchema>;
export type UpdateTableBody = z.infer<typeof updateTableBodySchema>;
