import type { FastifyPluginAsync } from "fastify";
import { adminRoutes } from "./admin.routes.js";
import { authRoutes } from "./auth.routes.js";
import { billingRoutes } from "./billing.routes.js";
import { cashierRoutes } from "./cashier.routes.js";
import { dashboardRoutes } from "./dashboard.routes.js";
import { healthRoutes } from "./health.routes.js";
import { menuRoutes } from "./menu.routes.js";
import { notificationRoutes } from "./notification.routes.js";
import { orderRoutes } from "./order.routes.js";
import { paymentRoutes } from "./payment.routes.js";
import { publicRoutes } from "./public.routes.js";
import { reportRoutes } from "./report.routes.js";
import { shopRoutes } from "./shop.routes.js";
import { staffRoutes } from "./staff.routes.js";
import { tableRoutes } from "./table.routes.js";
import { uploadRoutes } from "./upload.routes.js";

/** รวมทุก route ไว้ที่เดียว ทุกเส้นอยู่ใต้ /api */
export const routes: FastifyPluginAsync = async (app) => {
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(adminRoutes, { prefix: "/admin" });
  await app.register(publicRoutes, { prefix: "/public" });
  await app.register(shopRoutes, { prefix: "/shop" });
  await app.register(dashboardRoutes, { prefix: "/dashboard" });
  await app.register(orderRoutes, { prefix: "/orders" });
  await app.register(menuRoutes, { prefix: "/menu" });
  await app.register(tableRoutes, { prefix: "/tables" });
  await app.register(cashierRoutes, { prefix: "/cashier" });
  await app.register(reportRoutes, { prefix: "/reports" });
  await app.register(staffRoutes, { prefix: "/staff" });
  await app.register(notificationRoutes, { prefix: "/notifications" });
  await app.register(uploadRoutes, { prefix: "/uploads" });
  await app.register(billingRoutes, { prefix: "/billing" });
  await app.register(paymentRoutes, { prefix: "/payments" });
};
