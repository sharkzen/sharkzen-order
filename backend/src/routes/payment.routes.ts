import type { FastifyPluginAsync } from "fastify";
import { paymentController } from "../controllers/payment.controller.js";

export const paymentRoutes: FastifyPluginAsync = async (app) => {
  app.post("/checkout", paymentController.createCheckout);

  // Stripe ตรวจลายเซ็นจาก raw body จึงต้องไม่ parse JSON เฉพาะ scope นี้
  await app.register(async (webhookScope) => {
    webhookScope.addContentTypeParser(
      "application/json",
      { parseAs: "buffer" },
      (_request, body, done) => done(null, body),
    );
    webhookScope.post("/webhook", paymentController.webhook);
  });
};
