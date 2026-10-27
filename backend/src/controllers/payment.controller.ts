import type { FastifyRequest } from "fastify";
import { createCheckoutBodySchema } from "../schemas/payment.schema.js";
import { paymentService } from "../services/payment.service.js";
import { SocketEvent } from "../sockets/events.js";

export const paymentController = {
  createCheckout(request: FastifyRequest) {
    const { orderId } = createCheckoutBodySchema.parse(request.body);
    return paymentService.createCheckoutSession(orderId);
  },

  async webhook(request: FastifyRequest) {
    const signature = request.headers["stripe-signature"];
    const event = paymentService.constructEvent(
      request.body as Buffer,
      Array.isArray(signature) ? signature[0] : signature,
    );

    const order = await paymentService.handleEvent(event);
    if (order) request.server.io.emit(SocketEvent.OrderUpdated, order);
    return { received: true };
  },
};
