import type { FastifyPluginAsync } from "fastify";
import { idParamsSchema } from "@/schemas/menu.schema.js";
import {
  createTablesBodySchema,
  deleteTablesBodySchema,
  reorderTablesBodySchema,
  updateTableBodySchema,
} from "@/schemas/table.schema.js";
import { tableService } from "@/services/table.service.js";
import { SocketEvent } from "@/sockets/events.js";
import { shopHandler } from "@/utils/route.js";

export const tableRoutes: FastifyPluginAsync = async (app) => {
  const auth = { onRequest: [app.authenticate] };

  app.get("/", auth, shopHandler(({ shopId }) => tableService.list(shopId)));

  app.post(
    "/",
    auth,
    shopHandler(async ({ shopId, request, reply, emit }) => {
      const tables = await tableService.create(shopId, createTablesBodySchema.parse(request.body));
      emit(SocketEvent.TablesChanged);
      return reply.code(201).send(tables);
    }),
  );
  app.post(
    "/delete",
    auth,
    shopHandler(async ({ shopId, request, reply, emit }) => {
      await tableService.remove(shopId, deleteTablesBodySchema.parse(request.body).ids);
      emit(SocketEvent.TablesChanged);
      return reply.code(204).send();
    }),
  );
  app.put(
    "/order",
    auth,
    shopHandler(async ({ shopId, request, emit }) => {
      await tableService.reorder(shopId, reorderTablesBodySchema.parse(request.body).ids);
      emit(SocketEvent.TablesChanged);
      return { ok: true };
    }),
  );
  app.patch(
    "/:id",
    auth,
    shopHandler(async ({ shopId, request, emit }) => {
      const { id } = idParamsSchema.parse(request.params);
      const table = await tableService.update(shopId, id, updateTableBodySchema.parse(request.body));
      emit(SocketEvent.TablesChanged);
      return table;
    }),
  );
  app.post(
    "/:id/open",
    auth,
    shopHandler(async ({ shopId, request, emit }) => {
      const table = await tableService.open(shopId, idParamsSchema.parse(request.params).id);
      emit(SocketEvent.TablesChanged);
      return table;
    }),
  );
  app.post(
    "/:id/close",
    auth,
    shopHandler(async ({ shopId, request, emit }) => {
      const table = await tableService.close(shopId, idParamsSchema.parse(request.params).id);
      emit(SocketEvent.TablesChanged);
      return table;
    }),
  );
};
