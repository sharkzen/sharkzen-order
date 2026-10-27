import type Stripe from "stripe";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { stripe } from "../lib/stripe.js";
import { AppError, notFound } from "../utils/errors.js";

/** Stripe รับยอดเป็นหน่วยย่อย (สตางค์) */
const toSatang = (baht: unknown) => Math.round(Number(baht) * 100);

export const paymentService = {
  async createCheckoutSession(orderId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw notFound("Order");
    if (order.paymentStatus === "PAID") throw new AppError(409, "Order is already paid");
    if (order.status === "CANCELLED") throw new AppError(400, "Order is cancelled");

    const lineItems = order.items
      .filter((item) => item.quantity - item.cancelledQty > 0)
      .map((item) => ({
        quantity: item.quantity - item.cancelledQty,
        price_data: {
          currency: "thb",
          unit_amount: toSatang(item.price),
          product_data: { name: item.name },
        },
      }));
    if (lineItems.length === 0) throw new AppError(400, "Order has nothing to pay");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      client_reference_id: order.id,
      metadata: { orderId: order.id },
      success_url: `${env.FRONTEND_URL}/cashier?paid=${order.id}`,
      cancel_url: `${env.FRONTEND_URL}/cashier?cancelled=${order.id}`,
    });

    await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
    return { url: session.url };
  },

  constructEvent(rawBody: Buffer, signature: string | undefined) {
    if (!env.STRIPE_WEBHOOK_SECRET) throw new AppError(500, "STRIPE_WEBHOOK_SECRET is not set");
    if (!signature) throw new AppError(400, "Missing stripe-signature header");
    try {
      return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch {
      throw new AppError(400, "Invalid webhook signature");
    }
  },

  /** คืน order ที่เพิ่งถูกทำเป็นจ่ายแล้ว (หรือ null ถ้า event นี้ไม่เกี่ยว/ประมวลผลไปแล้ว) */
  async handleEvent(event: Stripe.Event) {
    if (
      event.type !== "checkout.session.completed" &&
      event.type !== "checkout.session.async_payment_succeeded"
    ) {
      return null;
    }

    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    if (!orderId || session.payment_status !== "paid") return null;

    const { count } = await prisma.order.updateMany({
      where: { id: orderId, paymentStatus: "UNPAID" },
      data: { paymentStatus: "PAID", paidAt: new Date() },
    });
    if (count === 0) return null;

    return prisma.order.findUnique({ where: { id: orderId }, include: { table: true, items: true } });
  },
};
