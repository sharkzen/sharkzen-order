import type { FastifyInstance } from "fastify";
import { Server } from "socket.io";
import { env } from "../config/env.js";

export function createSocketServer(app: FastifyInstance) {
  const io = new Server(app.server, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
  });

  io.on("connection", (socket) => {
    app.log.info({ id: socket.id }, "socket connected");
    socket.on("disconnect", () => app.log.info({ id: socket.id }, "socket disconnected"));
  });

  return io;
}
