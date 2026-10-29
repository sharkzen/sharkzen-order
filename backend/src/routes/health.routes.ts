import type { FastifyPluginAsync } from "fastify";
import { prisma } from "@/lib/prisma.js";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  /** liveness: process ยังตอบได้ (ใช้กับ container restart) ไม่แตะฐานข้อมูลเพื่อไม่ให้ DB ล่มแล้วถูก restart วน */
  app.get("/health/live", () => ({ status: "ok", uptime: Math.round(process.uptime()) }));

  /** readiness/uptime monitor: ต้องต่อฐานข้อมูลได้และมีแพ็กเกจโหลดแล้ว ไม่ได้ = 503 */
  app.get("/health", async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      app.log.error(error, "health check: database down");
      return reply.code(503).send({ status: "error", database: "down" });
    }
    return { status: "ok", database: "up", uptime: Math.round(process.uptime()) };
  });
};
