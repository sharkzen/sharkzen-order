import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { notificationService } from "@/services/notification.service.js";
import { shopHandler } from "@/utils/route.js";

const idParams = z.object({ id: z.string().min(1) });
const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(15),
  after: z.string().min(1).optional(),
});

export const notificationRoutes: FastifyPluginAsync = async (app) => {
  const auth = { onRequest: [app.authenticate] };

  app.get(
    "/",
    auth,
    shopHandler(({ shopId, request }) => {
      const { limit, after } = listQuery.parse(request.query);
      return notificationService.list(shopId, limit, after);
    }),
  );

  app.post(
    "/read-all",
    auth,
    shopHandler(async ({ shopId }) => {
      await notificationService.markAllRead(shopId);
      return { ok: true };
    }),
  );

  app.post(
    "/:id/read",
    auth,
    shopHandler(async ({ shopId, request }) => {
      await notificationService.markRead(shopId, idParams.parse(request.params).id);
      return { ok: true };
    }),
  );
};
