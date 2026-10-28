import type { FastifyPluginAsync } from "fastify";
import { orderController } from "@/controllers/order.controller.js";

export const orderRoutes: FastifyPluginAsync = async (app) => {
  const auth = { onRequest: [app.authenticate] };
  app.get("/", auth, orderController.list);
  app.get("/:id", auth, orderController.get);
  app.patch("/:id/status", auth, orderController.updateStatus);
  app.post("/:id/cancel", auth, orderController.cancel);
  app.post("/:id/ack-cancel", auth, orderController.ackCancel);
  app.post("/:id/items/:itemId/cancel", auth, orderController.cancelItem);
};
