import type { FastifyReply, FastifyRequest } from "fastify";
import type { Server } from "socket.io";
import { shopService } from "@/services/shop.service.js";
import { shopRoom } from "@/sockets/events.js";

interface ShopContext {
  shopId: string;
  request: FastifyRequest;
  reply: FastifyReply;
  /** ส่ง event ไปยังทุก client ของร้านนี้ */
  emit: (event: string, payload?: unknown) => void;
  io: Server;
}

/** handler ของ route เจ้าของร้าน: หา shopId จาก session ให้ และมี emit เฉพาะห้องของร้าน */
export const shopHandler =
  <T>(fn: (ctx: ShopContext) => Promise<T> | T) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const shopId = await shopService.idForUser(request.user.sub);
    const io = request.server.io;
    return fn({
      shopId,
      request,
      reply,
      io,
      emit: (event, payload) => io.to(shopRoom(shopId)).emit(event, payload),
    });
  };
