import type { Shop } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";
import { deleteImage, isOwnImage } from "@/lib/storage.js";
import type { UpdateShopBody } from "@/schemas/shop.schema.js";
import { billingService } from "@/services/billing.service.js";
import { AppError, shopSuspendedError } from "@/utils/errors.js";

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
  /**
   * สาขาที่ผู้ใช้กำลังจัดการอยู่ ทุก query ข้อมูลร้านต้องกรองด้วย id นี้
   * ใช้สาขาที่เลือกไว้ล่าสุด ถ้ายังไม่เคยเลือก (หรือสาขานั้นไม่ใช่ของบัญชีนี้แล้ว) ใช้สาขาแรกที่สร้าง
   */
  async idForUser(userId: string) {
    const [user, shops] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { activeShopId: true } }),
      prisma.shop.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "asc" }, select: { id: true, suspendedAt: true, suspendReason: true } }),
    ]);
    if (shops.length === 0) throw new AppError(403, "บัญชีนี้ยังไม่มีร้าน", "NO_SHOP");
    // สาขาที่ถูกระงับเข้าไม่ได้ ข้ามไปสาขาที่ยังใช้ได้ ถ้าถูกระงับหมดทุกสาขาจึงแจ้งให้ติดต่อผู้ดูแลระบบ
    const usable = shops.filter((shop) => !shop.suspendedAt);
    const active = usable.find((shop) => shop.id === user?.activeShopId) ?? usable[0];
    if (!active) throw shopSuspendedError(shops[0]?.suspendReason);
    return active.id;
  },

  /** สาขาทั้งหมดของบัญชี พร้อมบอกว่าสาขาไหนกำลังใช้อยู่ */
  async branches(userId: string) {
    const [activeId, shops] = await Promise.all([
      this.idForUser(userId),
      prisma.shop.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "asc" } }),
    ]);
    const plan = await billingService.planOf(userId);
    return {
      /** จำนวนสาขาสูงสุดของแพ็กเกจที่ใช้อยู่ */
      limit: plan.limits.branches,
      planName: plan.name,
      items: shops.map((shop) => ({
        id: shop.id,
        name: shop.name,
        branch: shop.branch,
        isOpen: shop.isOpen,
        active: shop.id === activeId,
        suspended: shop.suspendedAt !== null,
      })),
    };
  },

  /** เปลี่ยนสาขาที่จัดการอยู่ (ต้องเป็นสาขาของบัญชีนี้เท่านั้น) */
  async switchBranch(userId: string, shopId: string) {
    const shop = await prisma.shop.findFirst({ where: { id: shopId, ownerId: userId }, select: { id: true } });
    if (!shop) throw new AppError(404, "ไม่พบสาขานี้", "BRANCH_NOT_FOUND");
    await prisma.user.update({ where: { id: userId }, data: { activeShopId: shop.id } });
  },

  /** สร้างสาขาใหม่ใช้ชื่อร้านเดียวกับสาขาปัจจุบัน แล้วสลับไปสาขานั้นทันที ตรวจเพดานตามแพ็กเกจก่อน */
  async createBranch(userId: string, branch: string) {
    await billingService.assertBranchLimit(userId);
    const current = await prisma.shop.findUniqueOrThrow({ where: { id: await this.idForUser(userId) } });
    const duplicate = await prisma.shop.findFirst({ where: { ownerId: userId, branch }, select: { id: true } });
    if (duplicate) throw new AppError(409, "มีสาขาชื่อนี้อยู่แล้ว", "DUPLICATE_BRANCH");
    const created = await prisma.shop.create({
      data: { ownerId: userId, name: current.name, branch, phone: current.phone, serviceChargePercent: current.serviceChargePercent, vatIncluded: current.vatIncluded },
    });
    await prisma.user.update({ where: { id: userId }, data: { activeShopId: created.id } });
    return created.id;
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
