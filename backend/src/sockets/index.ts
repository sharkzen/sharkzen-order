import type { FastifyInstance } from "fastify";
import { Server } from "socket.io";
import { env } from "@/config/env.js";
import { SESSION_COOKIE } from "@/controllers/auth.controller.js";
import { shopService } from "@/services/shop.service.js";
import { shopRoom } from "./events.js";

export function createSocketServer(app: FastifyInstance) {
  const io = new Server(app.server, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
  });

  io.on("connection", async (socket) => {
    app.log.info({ id: socket.id }, "socket connected");

    // เข้าห้องร้านด้วย session cookie เดียวกับ REST ไม่มี session = ไม่ได้รับ event ของร้านใด
    try {
      const token = app.parseCookie(socket.handshake.headers.cookie ?? "")[SESSION_COOKIE];
      if (token) {
        const { sub } = app.jwt.verify<{ sub: string }>(token);
        await socket.join(shopRoom(await shopService.idForUser(sub)));
      }
    } catch {
      // token ไม่ถูกต้อง/หมดอายุ/ไม่มีร้าน: ปล่อยเป็น socket ที่ไม่ได้เข้าห้องใด
    }

    socket.on("disconnect", () => app.log.info({ id: socket.id }, "socket disconnected"));
  });

  return io;
}
