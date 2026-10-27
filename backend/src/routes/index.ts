import type { FastifyPluginAsync } from "fastify";
import { healthRoutes } from "./health.routes.js";
import { orderRoutes } from "./order.routes.js";

/** รวมทุก route ไว้ที่เดียว ทุกเส้นอยู่ใต้ /api */
export const routes: FastifyPluginAsync = async (app) => {
  await app.register(healthRoutes);
  await app.register(orderRoutes, { prefix: "/orders" });
};
