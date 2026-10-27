import type { FastifyPluginAsync } from "fastify";
import { orderController } from "../controllers/order.controller.js";

export const orderRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", orderController.list);
  app.get("/:id", orderController.get);
  app.post("/", orderController.create);
  app.patch("/:id/status", orderController.updateStatus);
};
