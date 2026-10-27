import type { FastifyRequest } from "fastify";
import type { Server } from "socket.io";

declare module "fastify" {
  interface FastifyInstance {
    io: Server;
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}
