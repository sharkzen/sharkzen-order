import type { FastifyPluginAsync } from "fastify";
import {
  createStaffBodySchema,
  idParamsSchema,
  resetPasswordBodySchema,
  roleBodySchema,
  updateStaffBodySchema,
} from "@/schemas/staff.schema.js";
import { staffService } from "@/services/staff.service.js";
import { SocketEvent } from "@/sockets/events.js";
import { shopHandler } from "@/utils/route.js";

export const staffRoutes: FastifyPluginAsync = async (app) => {
  const auth = { onRequest: [app.authenticate] };

  app.get("/", auth, shopHandler(({ shopId, request }) => staffService.overview(shopId, request.user.sub)));

  app.post(
    "/roles",
    auth,
    shopHandler(async ({ shopId, request, reply, emit }) => {
      const role = await staffService.createRole(shopId, roleBodySchema.parse(request.body));
      emit(SocketEvent.StaffChanged);
      return reply.code(201).send(role);
    }),
  );
  app.put(
    "/roles/:id",
    auth,
    shopHandler(async ({ shopId, request, emit }) => {
      const role = await staffService.updateRole(
        shopId,
        idParamsSchema.parse(request.params).id,
        roleBodySchema.parse(request.body),
      );
      emit(SocketEvent.StaffChanged);
      return role;
    }),
  );
  app.delete(
    "/roles/:id",
    auth,
    shopHandler(async ({ shopId, request, reply, emit }) => {
      await staffService.deleteRole(shopId, idParamsSchema.parse(request.params).id);
      emit(SocketEvent.StaffChanged);
      return reply.code(204).send();
    }),
  );

  app.post(
    "/members",
    auth,
    shopHandler(async ({ shopId, request, reply, emit }) => {
      const member = await staffService.createStaff(shopId, createStaffBodySchema.parse(request.body));
      emit(SocketEvent.StaffChanged);
      return reply.code(201).send(member);
    }),
  );
  app.patch(
    "/members/:id",
    auth,
    shopHandler(async ({ shopId, request, emit }) => {
      const member = await staffService.updateStaff(
        shopId,
        idParamsSchema.parse(request.params).id,
        updateStaffBodySchema.parse(request.body),
      );
      emit(SocketEvent.StaffChanged);
      return member;
    }),
  );
  app.post(
    "/members/:id/reset-password",
    auth,
    shopHandler(async ({ shopId, request, emit }) => {
      await staffService.resetPassword(
        shopId,
        idParamsSchema.parse(request.params).id,
        resetPasswordBodySchema.parse(request.body).password,
      );
      emit(SocketEvent.StaffChanged);
      return { ok: true };
    }),
  );
  app.delete(
    "/members/:id",
    auth,
    shopHandler(async ({ shopId, request, reply, emit }) => {
      await staffService.deleteStaff(shopId, idParamsSchema.parse(request.params).id);
      emit(SocketEvent.StaffChanged);
      return reply.code(204).send();
    }),
  );
};
