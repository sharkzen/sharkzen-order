import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { billingService } from "@/services/billing.service.js";
import { shopHandler } from "@/utils/route.js";

const choiceSchema = z.object({
  plan: z.string().min(1).max(40),
  billing: z.enum(["monthly", "yearly"]),
});
const checkoutSchema = choiceSchema.extend({ method: z.enum(["card", "promptpay"]).default("card") });

export const billingRoutes: FastifyPluginAsync = async (app) => {
  const auth = { onRequest: [app.authenticate] };

  app.get("/", auth, shopHandler(({ shopId, request }) => billingService.overview(request.user.sub, shopId)));

  app.get("/invoices", auth, (request) => billingService.invoices(request.user.sub));

  // สมัครแพ็กเกจครั้งแรก → ไปหน้าชำระเงินของ Stripe
  app.post("/checkout", auth, (request) => {
    const { plan, billing, method } = checkoutSchema.parse(request.body);
    return billingService.createCheckout(request.user.sub, plan, billing, method);
  });

  app.post("/sync", auth, (request) => {
    const { sessionId } = z.object({ sessionId: z.string().min(1) }).parse(request.body);
    return billingService.syncCheckout(request.user.sub, sessionId);
  });

  app.post("/change", auth, (request) => {
    const { plan, billing } = choiceSchema.parse(request.body);
    return billingService.changePlan(request.user.sub, plan, billing);
  });

  app.post("/cancel", auth, (request) => billingService.setCancelAtPeriodEnd(request.user.sub, true));
  app.post("/resume", auth, (request) => billingService.setCancelAtPeriodEnd(request.user.sub, false));
  app.post("/portal", auth, (request) => billingService.portal(request.user.sub));
};
