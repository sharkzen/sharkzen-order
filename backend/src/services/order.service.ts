import type { OrderStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import type { CreateOrderBody, ListOrdersQuery } from "../schemas/order.schema.js";
import { AppError, notFound } from "../utils/errors.js";

const include = { table: true, items: true } as const;

export const orderService = {
  list({ status }: ListOrdersQuery) {
    return prisma.order.findMany({
      where: status ? { status } : undefined,
      include,
      orderBy: { createdAt: "asc" },
    });
  },

  async getById(id: string) {
    const order = await prisma.order.findUnique({ where: { id }, include });
    if (!order) throw notFound("Order");
    return order;
  },

  async create({ tableId, notes, items }: CreateOrderBody) {
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: items.map((item) => item.menuItemId) } },
    });
    const byId = new Map(menuItems.map((menuItem) => [menuItem.id, menuItem]));

    const lines = items.map((item) => {
      const menuItem = byId.get(item.menuItemId);
      if (!menuItem) throw new AppError(400, `Menu item ${item.menuItemId} not found`);
      if (!menuItem.available) throw new AppError(400, `${menuItem.name} is unavailable`);
      return {
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
      };
    });
    const total = lines.reduce((sum, line) => sum + Number(line.price) * line.quantity, 0);

    return prisma.order.create({
      data: { tableId, notes, total, items: { create: lines } },
      include,
    });
  },

  async updateStatus(id: string, status: OrderStatus) {
    await this.getById(id);
    return prisma.order.update({ where: { id }, data: { status }, include });
  },
};
