import { z } from "zod";

const id = z.string().min(1);
export const idParamsSchema = z.object({ id });

const permissions = z.array(z.string().regex(/^[a-z]+\.[a-z]+$/)).max(100);

export const roleBodySchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อบทบาท").max(40),
  description: z.string().trim().max(200).default(""),
  permissions,
});

const password = z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร").max(100);

export const createStaffBodySchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อ").max(60),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,30}$/, "ชื่อผู้ใช้ใช้ได้เฉพาะ a-z 0-9 . _ - ยาว 3–30 ตัว"),
  roleId: id,
  password,
});

export const updateStaffBodySchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  roleId: id.optional(),
  suspended: z.boolean().optional(),
});

export const resetPasswordBodySchema = z.object({ password });

export type RoleBody = z.infer<typeof roleBodySchema>;
export type CreateStaffBody = z.infer<typeof createStaffBodySchema>;
export type UpdateStaffBody = z.infer<typeof updateStaffBodySchema>;
