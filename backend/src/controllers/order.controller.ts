import type { FastifyReply, FastifyRequest } from "fastify";
import {
  createOrderBodySchema,
  listOrdersQuerySchema,
  orderIdParamsSchema,
  updateOrderStatusBodySchema,
} from "../schemas/order.schema.js";
import { orderService } from "../services/order.service.js";
import { SocketEvent } from "../sockets/events.js";

export const orderController = {
  list(request: FastifyRequest) {
    return orderService.list(listOrdersQuerySchema.parse(request.query));
  },

  get(request: FastifyRequest) {
    const { id } = orderIdParamsSchema.parse(request.params);
    return orderService.getById(id);
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const order = await orderService.create(createOrderBodySchema.parse(request.body));
    request.server.io.emit(SocketEvent.OrderCreated, order);
    return reply.code(201).send(order);
  },

  async updateStatus(request: FastifyRequest) {
    const { id } = orderIdParamsSchema.parse(request.params);
    const { status } = updateOrderStatusBodySchema.parse(request.body);
    const order = await orderService.updateStatus(id, status);
    request.server.io.emit(SocketEvent.OrderUpdated, order);
    return order;
  },
};
