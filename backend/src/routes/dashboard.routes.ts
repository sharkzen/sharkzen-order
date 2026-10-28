import type { FastifyPluginAsync } from "fastify";
import { dashboardController } from "@/controllers/dashboard.controller.js";

export const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.get("/overview", { onRequest: [app.authenticate] }, dashboardController.overview);
};
