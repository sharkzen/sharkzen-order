import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import { z } from "zod";
import { prisma } from "@/lib/prisma.js";
import {
  createPlanBodySchema,
  idParamsSchema,
  listQuerySchema,
  reasonBodySchema,
  settingsBodySchema,
  subscriptionPatchSchema,
  updatePlanBodySchema,
} from "@/schemas/admin.schema.js";
import { adminService, type AdminActor } from "@/services/admin.service.js";

const idOf = (request: FastifyRequest) => idParamsSchema.parse(request.params).id;
const logQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

/** พื้นที่ผู้ดูแลระบบ: ทุกเส้นต้องล็อกอินเป็น ADMIN เท่านั้น */
export const adminRoutes: FastifyPluginAsync = async (app) => {
  const guard = { onRequest: [app.authenticateAdmin] };
  const actor = (request: FastifyRequest): Promise<AdminActor> =>
    prisma.user.findUniqueOrThrow({ where: { id: request.user.sub }, select: { id: true, email: true } });

  app.get("/overview", guard, () => adminService.overview());

  app.get("/users", guard, (request) => adminService.listUsers(listQuerySchema.parse(request.query)));
  app.get("/users/:id", guard, (request) => adminService.userDetail(idOf(request)));
  app.post("/users/:id/ban", guard, async (request) => {
    const { reason } = reasonBodySchema.parse(request.body ?? {});
    await adminService.banUser(request.server.io, await actor(request), idOf(request), reason);
    return { ok: true };
  });
  app.post("/users/:id/unban", guard, async (request) => {
    await adminService.unbanUser(request.server.io, await actor(request), idOf(request));
    return { ok: true };
  });
  app.patch("/users/:id/subscription", guard, async (request) =>
    adminService.updateSubscription(await actor(request), idOf(request), subscriptionPatchSchema.parse(request.body)),
  );

  app.get("/shops", guard, (request) => adminService.listShops(listQuerySchema.parse(request.query)));
  app.post("/shops/:id/suspend", guard, async (request) => {
    const { reason } = reasonBodySchema.parse(request.body ?? {});
    await adminService.setShopSuspended(request.server.io, await actor(request), idOf(request), true, reason);
    return { ok: true };
  });
  app.post("/shops/:id/unsuspend", guard, async (request) => {
    await adminService.setShopSuspended(request.server.io, await actor(request), idOf(request), false, "");
    return { ok: true };
  });

  app.get("/plans", guard, () => adminService.listPlans());
  app.post("/plans", guard, async (request) => {
    await adminService.createPlan(await actor(request), createPlanBodySchema.parse(request.body));
    return { ok: true };
  });
  app.put("/plans/:id", guard, async (request) => {
    await adminService.updatePlan(await actor(request), idOf(request), updatePlanBodySchema.parse(request.body));
    return { ok: true };
  });
  app.delete("/plans/:id", guard, async (request) => {
    await adminService.deletePlan(await actor(request), idOf(request));
    return { ok: true };
  });

  app.get("/settings", guard, () => adminService.settings());
  app.put("/settings", guard, async (request) =>
    adminService.updateSettings(await actor(request), settingsBodySchema.parse(request.body)),
  );

  app.get("/logs", guard, (request) => {
    const { page, pageSize } = logQuerySchema.parse(request.query);
    return adminService.logs(page, pageSize);
  });
};
