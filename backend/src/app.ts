import cors from "@fastify/cors";
import Fastify from "fastify";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import { authPlugin } from "./plugins/auth.js";
import { socketPlugin } from "./plugins/socket.js";
import { routes } from "./routes/index.js";
import { AppError } from "./utils/errors.js";

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === "development" ? { transport: { target: "pino-pretty" } } : true,
  });

  // ต้อง set ก่อน register เพื่อให้ route ที่อยู่ใน plugin สืบทอด handler นี้
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply
        .code(400)
        .send({ message: error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง", issues: error.issues });
    }
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({ message: error.message, code: error.code });
    }
    // error ของ Fastify/plugin ที่เป็นฝั่ง client เช่น rate limit (429), body ไม่ถูกต้อง
    const status = (error as { statusCode?: number }).statusCode;
    if (status && status >= 400 && status < 500) {
      const message = status === 429 ? "ทำรายการถี่เกินไป กรุณารอสักครู่แล้วลองใหม่" : (error as Error).message;
      return reply.code(status).send({ message });
    }
    app.log.error(error);
    return reply.code(500).send({ message: "Internal server error" });
  });

  await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
  await app.register(authPlugin);
  await app.register(socketPlugin);
  await app.register(routes, { prefix: "/api" });

  return app;
}
