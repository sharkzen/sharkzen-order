import { z } from "zod";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "เวลาต้องเป็น HH:mm");

export const dayHoursSchema = z.object({ open: z.boolean(), from: time, to: time });

export const updateShopBodySchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อร้าน").max(80),
  branch: z.string().trim().max(80),
  phone: z.string().trim().max(20),
  address: z.string().trim().max(300),
  coverImage: z.string().max(500),
  hours: z.array(dayHoursSchema).length(7),
  payBeforeKitchen: z.boolean(),
  acceptTransfer: z.boolean(),
  acceptCash: z.boolean(),
  acceptCounter: z.boolean(),
  promptPayId: z.string().regex(/^(\d{10}|\d{13})?$/, "เลขพร้อมเพย์ต้องเป็นเบอร์โทร 10 หลัก หรือเลขประจำตัว 13 หลัก"),
  promptPayTitle: z.enum(["", "นาย", "นาง", "นางสาว"]),
  promptPayFirstName: z.string().trim().max(60),
  promptPayLastName: z.string().trim().max(60),
  serviceChargePercent: z.number().int().min(0).max(30),
  vatIncluded: z.boolean(),
  newOrderSound: z.boolean(),
  newOrderPopup: z.boolean(),
  dailySummary: z.boolean(),
});

export const setShopOpenBodySchema = z.object({ isOpen: z.boolean() });

export type UpdateShopBody = z.infer<typeof updateShopBodySchema>;

export const createBranchBodySchema = z.object({
  branch: z.string().trim().min(1, "กรุณาตั้งชื่อสาขา").max(60),
});

export const switchBranchBodySchema = z.object({ shopId: z.string().uuid() });
