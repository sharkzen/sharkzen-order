import type { FastifyRequest } from "fastify";
import type { StaffContext } from "@/lib/access.js";
import type { Server } from "socket.io";

declare module "fastify" {
  interface FastifyInstance {
    io: Server;
    authenticate: (request: FastifyRequest) => Promise<void>;
    /** ต้องล็อกอินและเป็นผู้ดูแลระบบ (role ADMIN) */
    authenticateAdmin: (request: FastifyRequest) => Promise<void>;
  }
}

declare module "fastify" {
  interface FastifyRequest {
    /** มีเมื่อ session เป็นของพนักงาน (ไม่ใช่เจ้าของ/ผู้ดูแล) */
    staff: StaffContext | null;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    /** sub = id ผู้ใช้ (เจ้าของ/ผู้ดูแล) หรือ id พนักงานเมื่อ kind = "staff" */
    payload: { sub: string; kind?: "staff" };
    user: { sub: string; kind?: "staff" };
  }
}
