import type { FastifyPluginAsync } from "fastify";
import { payBillBodySchema, tableParamsSchema } from "@/schemas/cashier.schema.js";
import { cashierService } from "@/services/cashier.service.js";
import { notificationService } from "@/services/notification.service.js";
import { orderDto, orderService } from "@/services/order.service.js";
import { SocketEvent } from "@/sockets/events.js";
import { shopHandler } from "@/utils/route.js";

export const cashierRoutes: FastifyPluginAsync = async (app) => {
  const auth = { onRequest: [app.authenticate] };

  app.get("/bills", auth, shopHandler(({ shopId }) => cashierService.bills(shopId)));

  app.post(
    "/tables/:tableId/pay",
    auth,
    shopHandler(async ({ shopId, request, emit, io }) => {
      const { tableId } = tableParamsSchema.parse(request.params);
      const { bill, tableName, orderIds } = await cashierService.pay(
        shopId,
        tableId,
        payBillBodySchema.parse(request.body),
      );
      // แจ้งหน้าออเดอร์/ครัว/แดชบอร์ดให้เห็นสถานะชำระล่าสุดของแต่ละออเดอร์
      for (const id of orderIds) {
        emit(SocketEvent.OrderUpdated, orderDto(await orderService.getById(shopId, id)));
      }
      emit(SocketEvent.TablesChanged);
      await notificationService.push(io, shopId, {
        type: "ORDER_PAID",
        title: `รับชำระเงินแล้ว • ${tableName}`,
        body: `฿${bill.total.toLocaleString("th-TH")} • ${bill.method === "CASH" ? "เงินสด" : "โอนเงิน"}`,
        href: "/cashier",
      });
      return bill;
    }),
  );
};
