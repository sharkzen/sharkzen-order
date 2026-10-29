import type { FastifyInstance } from "fastify";
import { Server } from "socket.io";
import { env } from "@/config/env.js";
import { SESSION_COOKIE } from "@/controllers/auth.controller.js";
import { loadActiveStaff, userGate } from "@/lib/access.js";
import { shopService } from "@/services/shop.service.js";
import { findTableByToken } from "@/services/table.service.js";
import { shopRoom, tableRoom } from "./events.js";

export function createSocketServer(app: FastifyInstance) {
  const io = new Server(app.server, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
  });

  io.on("connection", async (socket) => {
    app.log.info({ id: socket.id }, "socket connected");

    // หน้าลูกค้า (ไม่ล็อกอิน): พิสูจน์ด้วย token ของโต๊ะจาก QR แล้วเข้าห้องโต๊ะนั้นเท่านั้น
    // ห้องนี้ได้รับแค่สัญญาณ "มีอะไรเปลี่ยน" ไม่มีข้อมูลออเดอร์ ข้อมูลจริงยังต้องโหลดผ่าน REST ที่ตรวจตั๋วรอบ
    const tableToken = (socket.handshake.auth as { table?: unknown } | undefined)?.table;
    if (typeof tableToken === "string") {
      try {
        await socket.join(tableRoom((await findTableByToken(tableToken)).id));
      } catch {
        // token ไม่ถูกต้อง: ไม่เข้าห้องใด
      }
      return;
    }

    // เข้าห้องร้านด้วย session cookie เดียวกับ REST ไม่มี session = ไม่ได้รับ event ของร้านใด
    try {
      const token = app.parseCookie(socket.handshake.headers.cookie ?? "")[SESSION_COOKIE];
      if (token) {
        const { sub, kind } = app.jwt.verify<{ sub: string; kind?: "staff" }>(token);
        if (kind === "staff") {
          // พนักงานเข้าห้องของร้านตัวเองเท่านั้น (loadActiveStaff โยน error ถ้าถูกระงับ/แบน)
          await socket.join(shopRoom((await loadActiveStaff(sub)).shopId));
        } else {
          // บัญชีที่ถูกแบนไม่เข้าห้องร้าน
          if ((await userGate(sub))?.bannedAt) return;
          await socket.join(shopRoom(await shopService.idForUser(sub)));
        }
      }
    } catch {
      // token ไม่ถูกต้อง/หมดอายุ/ไม่มีร้าน: ปล่อยเป็น socket ที่ไม่ได้เข้าห้องใด
    }

    socket.on("disconnect", () => app.log.info({ id: socket.id }, "socket disconnected"));
  });

  return io;
}
