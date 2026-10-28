import type { FastifyRequest } from "fastify";
import { dashboardQuerySchema } from "@/schemas/dashboard.schema.js";
import { shopService } from "@/services/shop.service.js";
import { dashboardService } from "@/services/dashboard.service.js";

export const dashboardController = {
  async overview(request: FastifyRequest) {
    const shopId = await shopService.idForUser(request.user.sub);
    return dashboardService.overview(shopId, dashboardQuerySchema.parse(request.query));
  },
};
