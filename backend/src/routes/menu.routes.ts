import type { FastifyPluginAsync } from "fastify";
import {
  categoryBodySchema,
  createItemsBodySchema,
  deleteCategoryQuerySchema,
  idParamsSchema,
  menuItemBodySchema,
  menuItemPatchSchema,
  reorderCategoriesBodySchema,
  reorderItemsBodySchema,
} from "@/schemas/menu.schema.js";
import { menuService } from "@/services/menu.service.js";
import { SocketEvent } from "@/sockets/events.js";
import { shopHandler } from "@/utils/route.js";

export const menuRoutes: FastifyPluginAsync = async (app) => {
  const auth = { onRequest: [app.authenticate] };

  app.get("/", auth, shopHandler(({ shopId }) => menuService.list(shopId)));

  app.post(
    "/categories",
    auth,
    shopHandler(async ({ shopId, request, reply, emit }) => {
      const category = await menuService.createCategory(shopId, categoryBodySchema.parse(request.body));
      emit(SocketEvent.MenuChanged);
      return reply.code(201).send(category);
    }),
  );
  // ต้องประกาศก่อน /categories/:id เพื่อไม่ให้ "order" ถูกตีเป็น id
  app.put(
    "/categories/order",
    auth,
    shopHandler(async ({ shopId, request, emit }) => {
      await menuService.reorderCategories(shopId, reorderCategoriesBodySchema.parse(request.body).ids);
      emit(SocketEvent.MenuChanged);
      return { ok: true };
    }),
  );
  app.patch(
    "/categories/:id",
    auth,
    shopHandler(async ({ shopId, request, emit }) => {
      const { id } = idParamsSchema.parse(request.params);
      const category = await menuService.updateCategory(shopId, id, categoryBodySchema.parse(request.body));
      emit(SocketEvent.MenuChanged);
      return category;
    }),
  );
  app.delete(
    "/categories/:id",
    auth,
    shopHandler(async ({ shopId, request, reply, emit }) => {
      const { deleteItems } = deleteCategoryQuerySchema.parse(request.query);
      await menuService.deleteCategory(shopId, idParamsSchema.parse(request.params).id, deleteItems === "true");
      emit(SocketEvent.MenuChanged);
      return reply.code(204).send();
    }),
  );

  app.post(
    "/items",
    auth,
    shopHandler(async ({ shopId, request, reply, emit }) => {
      const item = await menuService.createItem(shopId, menuItemBodySchema.parse(request.body));
      emit(SocketEvent.MenuChanged);
      return reply.code(201).send(item);
    }),
  );
  app.post(
    "/items/bulk",
    auth,
    shopHandler(async ({ shopId, request, reply, emit }) => {
      const { items } = createItemsBodySchema.parse(request.body);
      const created = await menuService.createItems(shopId, items);
      emit(SocketEvent.MenuChanged);
      return reply.code(201).send(created);
    }),
  );
  app.put(
    "/items/order",
    auth,
    shopHandler(async ({ shopId, request, emit }) => {
      const { categoryId, ids } = reorderItemsBodySchema.parse(request.body);
      await menuService.reorderItems(shopId, categoryId, ids);
      emit(SocketEvent.MenuChanged);
      return { ok: true };
    }),
  );
  app.patch(
    "/items/:id",
    auth,
    shopHandler(async ({ shopId, request, emit }) => {
      const { id } = idParamsSchema.parse(request.params);
      const item = await menuService.updateItem(shopId, id, menuItemPatchSchema.parse(request.body));
      emit(SocketEvent.MenuChanged);
      return item;
    }),
  );
  app.delete(
    "/items/:id",
    auth,
    shopHandler(async ({ shopId, request, reply, emit }) => {
      await menuService.deleteItem(shopId, idParamsSchema.parse(request.params).id);
      emit(SocketEvent.MenuChanged);
      return reply.code(204).send();
    }),
  );
};
