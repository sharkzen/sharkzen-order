import cors from "@fastify/cors";
import Fastify from "fastify";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import { socketPlugin } from "./plugins/socket.js";
import { routes } from "./routes/index.js";
import { AppError } from "./utils/errors.js";

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === "development" ? { transport: { target: "pino-pretty" } } : true,
  });

  await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
  await app.register(socketPlugin);
  await app.register(routes, { prefix: "/api" });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ message: "Validation failed", issues: error.issues });
    }
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({ message: error.message });
    }
    app.log.error(error);
    return reply.code(500).send({ message: "Internal server error" });
  });

  return app;
}
