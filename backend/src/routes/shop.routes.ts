import type { FastifyPluginAsync } from "fastify";
import { setShopOpenBodySchema, updateShopBodySchema } from "@/schemas/shop.schema.js";
import { notificationService } from "@/services/notification.service.js";
import { shopService } from "@/services/shop.service.js";
import { SocketEvent } from "@/sockets/events.js";
import { shopHandler } from "@/utils/route.js";

export const shopRoutes: FastifyPluginAsync = async (app) => {
  const auth = { onRequest: [app.authenticate] };

  app.get("/", auth, shopHandler(({ shopId }) => shopService.get(shopId)));

  app.put(
    "/",
    auth,
    shopHandler(async ({ shopId, request, emit }) => {
      const shop = await shopService.update(shopId, updateShopBodySchema.parse(request.body));
      emit(SocketEvent.ShopUpdated, shop);
      return shop;
    }),
  );

  // เปิด-ปิดรับออเดอร์ (ปิดแล้วลูกค้าสั่งไม่ได้ทันที)
  app.patch(
    "/open",
    auth,
    shopHandler(async ({ shopId, request, emit, io }) => {
      const { isOpen } = setShopOpenBodySchema.parse(request.body);
      const shop = await shopService.setOpen(shopId, isOpen);
      emit(SocketEvent.ShopUpdated, shop);
      await notificationService.push(io, shopId, {
        type: "SHOP_STATUS",
        title: isOpen ? "เปิดรับออเดอร์แล้ว" : "ปิดรับออเดอร์แล้ว",
        body: isOpen ? "ลูกค้าสแกน QR สั่งอาหารได้" : "ลูกค้าจะสั่งอาหารไม่ได้จนกว่าจะเปิดร้านอีกครั้ง",
        href: "/settings",
      });
      return shop;
    }),
  );
};
