import type { FastifyPluginAsync } from "fastify";
import { reportQuerySchema } from "@/schemas/report.schema.js";
import { reportService } from "@/services/report.service.js";
import { shopHandler } from "@/utils/route.js";

export const reportRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/sales",
    { onRequest: [app.authenticate] },
    shopHandler(({ shopId, request }) => reportService.sales(shopId, reportQuerySchema.parse(request.query))),
  );
};
