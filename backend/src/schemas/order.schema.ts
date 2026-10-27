import { z } from "zod";

export const orderStatusSchema = z.enum(["NEW", "PREPARING", "READY", "SERVED", "CANCELLED"]);

export const orderIdParamsSchema = z.object({ id: z.string().min(1) });

export const listOrdersQuerySchema = z.object({
  status: orderStatusSchema.optional(),
});

export const createOrderBodySchema = z.object({
  tableId: z.string().min(1),
  notes: z.array(z.string()).default([]),
  items: z
    .array(z.object({ menuItemId: z.string().min(1), quantity: z.number().int().positive() }))
    .min(1),
});

export const updateOrderStatusBodySchema = z.object({ status: orderStatusSchema });

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;
export type UpdateOrderStatusBody = z.infer<typeof updateOrderStatusBodySchema>;
