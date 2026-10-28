import fp from "fastify-plugin";
import { createSocketServer } from "@/sockets/index.js";

export const socketPlugin = fp(async (app) => {
  const io = createSocketServer(app);
  app.decorate("io", io);
  app.addHook("onClose", async () => {
    await io.close();
  });
});
