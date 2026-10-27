import { z } from "zod";

export const createCheckoutBodySchema = z.object({ orderId: z.string().min(1) });

export type CreateCheckoutBody = z.infer<typeof createCheckoutBodySchema>;
