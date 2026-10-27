import type { FastifyPluginAsync } from "fastify";
import { authRoutes } from "./auth.routes.js";
import { healthRoutes } from "./health.routes.js";
import { orderRoutes } from "./order.routes.js";
import { paymentRoutes } from "./payment.routes.js";

/** รวมทุก route ไว้ที่เดียว ทุกเส้นอยู่ใต้ /api */
export const routes: FastifyPluginAsync = async (app) => {
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(orderRoutes, { prefix: "/orders" });
  await app.register(paymentRoutes, { prefix: "/payments" });
};
