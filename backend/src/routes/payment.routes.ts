import type { FastifyPluginAsync } from "fastify";
import { paymentController } from "@/controllers/payment.controller.js";

/** webhook ของ Stripe (ซิงก์สถานะแพ็กเกจ) Stripe ตรวจลายเซ็นจาก raw body จึงต้องไม่ parse JSON ใน scope นี้ */
export const paymentRoutes: FastifyPluginAsync = async (app) => {
  app.addContentTypeParser("application/json", { parseAs: "buffer" }, (_request, body, done) => done(null, body));
  app.post("/webhook", paymentController.webhook);
};
