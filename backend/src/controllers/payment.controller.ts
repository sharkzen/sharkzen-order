import type { FastifyRequest } from "fastify";
import { billingService } from "@/services/billing.service.js";

/** Stripe ใช้เฉพาะค่าแพ็กเกจของเจ้าของร้าน (ลูกค้าจ่ายค่าอาหารที่หน้าคิดเงิน ไม่ผ่าน Stripe) */
export const paymentController = {
  async webhook(request: FastifyRequest) {
    const signature = request.headers["stripe-signature"];
    const event = billingService.constructEvent(
      request.body as Buffer,
      Array.isArray(signature) ? signature[0] : signature,
    );
    await billingService.handleEvent(event);
    return { received: true };
  },
};
