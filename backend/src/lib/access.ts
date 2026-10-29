import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";
import { bannedError, shopSuspendedError, AppError } from "@/utils/errors.js";

export interface UserGate {
  role: UserRole;
  bannedAt: Date | null;
  banReason: string;
  totpEnabledAt: Date | null;
}

/**
 * สถานะแบน/บทบาทของผู้ใช้ อ่านจากฐานข้อมูลทุกคำขอโดยไม่แคชในหน่วยความจำ
 * เพราะถ้ารัน backend หลายเครื่อง แคชต่อเครื่องจะทำให้การแบนมีผลไม่พร้อมกัน (ค้นด้วย primary key เร็วพอ)
 */
export async function userGate(userId: string): Promise<UserGate | null> {
  return prisma.user.findUnique({ where: { id: userId }, select: { role: true, bannedAt: true, banReason: true, totpEnabledAt: true } });
}

export interface StaffContext {
  id: string;
  name: string;
  username: string;
  shopId: string;
  ownerId: string;
  roleName: string;
  permissions: string[];
  mustChangePassword: boolean;
}

/**
 * โหลดพนักงานพร้อมตรวจว่ายังเข้าใช้ได้: บัญชีพนักงานไม่ถูกระงับ ร้านไม่ถูกระงับ และเจ้าของร้านไม่ถูกแบน
 * ใช้ทั้งตอนล็อกอิน ทุก API และตอนเชื่อม socket จึงบล็อกได้ทันทีที่ผู้ดูแลแบน/ระงับ
 */
export async function loadActiveStaff(staffId: string): Promise<StaffContext> {
  const member = await prisma.staffMember.findUnique({
    where: { id: staffId },
    include: { role: true, shop: { include: { owner: { select: { bannedAt: true, banReason: true } } } } },
  });
  if (!member) throw new AppError(401, "กรุณาเข้าสู่ระบบ", "UNAUTHORIZED");
  if (member.shop.owner.bannedAt) throw bannedError(member.shop.owner.banReason);
  if (member.shop.suspendedAt) throw shopSuspendedError(member.shop.suspendReason);
  if (member.suspended) throw new AppError(403, "บัญชีพนักงานนี้ถูกระงับ กรุณาติดต่อเจ้าของร้าน", "STAFF_SUSPENDED");
  return {
    id: member.id,
    name: member.name,
    username: member.username,
    shopId: member.shopId,
    ownerId: member.shop.ownerId,
    roleName: member.role.name,
    permissions: member.role.permissions,
    mustChangePassword: member.mustChangePassword,
  };
}
