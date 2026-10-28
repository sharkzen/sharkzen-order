import type { Shop } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";
import { deleteImage, isOwnImage } from "@/lib/storage.js";
import type { UpdateShopBody } from "@/schemas/shop.schema.js";
import { AppError } from "@/utils/errors.js";

const DEFAULT_HOURS = Array.from({ length: 7 }, () => ({ open: true, from: "10:00", to: "22:00" }));

/** hours ใน DB เป็น Json ที่อาจว่างในร้านใหม่ จึงเติมค่าตั้งต้นให้ครบ 7 วันเสมอ */
const hoursOf = (shop: Shop) =>
  Array.isArray(shop.hours) && shop.hours.length === 7
    ? (shop.hours as typeof DEFAULT_HOURS)
    : DEFAULT_HOURS;

export const toShopDto = (shop: Shop) => ({
  id: shop.id,
  name: shop.name,
  isOpen: shop.isOpen,
  branch: shop.branch,
  phone: shop.phone,
  address: shop.address,
  coverImage: shop.coverImage,
  hours: hoursOf(shop),
  payBeforeKitchen: shop.payBeforeKitchen,
  acceptTransfer: shop.acceptTransfer,
  acceptCash: shop.acceptCash,
  acceptCounter: shop.acceptCounter,
  promptPayId: shop.promptPayId,
  promptPayTitle: shop.promptPayTitle,
  promptPayFirstName: shop.promptPayFirstName,
  promptPayLastName: shop.promptPayLastName,
  serviceChargePercent: shop.serviceChargePercent,
  vatIncluded: shop.vatIncluded,
  newOrderSound: shop.newOrderSound,
  newOrderPopup: shop.newOrderPopup,
  dailySummary: shop.dailySummary,
  updatedAt: shop.updatedAt.toISOString(),
});

export const shopService = {
  /** ร้านของผู้ใช้ที่ล็อกอินอยู่ ทุก query ข้อมูลร้านต้องกรองด้วย id นี้ */
  async idForUser(userId: string) {
    const shop = await prisma.shop.findUnique({
      where: { ownerId: userId },
      select: { id: true },
    });
    if (!shop) throw new AppError(403, "บัญชีนี้ยังไม่มีร้าน", "NO_SHOP");
    return shop.id;
  },

  async get(shopId: string) {
    return toShopDto(await prisma.shop.findUniqueOrThrow({ where: { id: shopId } }));
  },

  async update(shopId: string, body: UpdateShopBody) {
    const { hours, ...rest } = body;
    // รูปปกต้องเป็นรูปที่ระบบอัปโหลดให้ร้านนี้เอง (หรือว่าง = เอาออก)
    if (rest.coverImage && !isOwnImage(shopId, rest.coverImage)) {
      throw new AppError(400, "รูปไม่ถูกต้อง กรุณาอัปโหลดรูปใหม่", "INVALID_IMAGE_URL");
    }
    const current = await prisma.shop.findUniqueOrThrow({ where: { id: shopId }, select: { coverImage: true } });
    const shop = await prisma.shop.update({ where: { id: shopId }, data: { ...rest, hours } });
    if (current.coverImage && current.coverImage !== rest.coverImage) deleteImage(shopId, current.coverImage);
    return toShopDto(shop);
  },

  async setOpen(shopId: string, isOpen: boolean) {
    return toShopDto(await prisma.shop.update({ where: { id: shopId }, data: { isOpen } }));
  },
};
