import type { Role, StaffMember } from "@prisma/client";
import { hashPassword } from "@/lib/crypto.js";
import { ALL_PERMISSIONS, BUILTIN_ROLES, normalizePermissions } from "@/lib/permissions.js";
import { billingService } from "@/services/billing.service.js";
import { prisma } from "@/lib/prisma.js";
import type { CreateStaffBody, RoleBody, UpdateStaffBody } from "@/schemas/staff.schema.js";
import { AppError, notFound } from "@/utils/errors.js";

/** เจ้าของร้านไม่ได้เก็บเป็น Role ใน DB (เป็นบัญชี User) จึงใช้ id คงที่นี้ */
export const OWNER_ROLE_ID = "owner";

const roleDto = (role: Role) => ({
  id: role.id,
  name: role.name,
  description: role.description,
  builtin: role.builtin,
  locked: false,
  permissions: role.permissions,
});

const staffDto = (member: StaffMember) => ({
  id: member.id,
  name: member.name,
  username: member.username,
  mustChangePassword: member.mustChangePassword,
  roleId: member.roleId,
  status: member.suspended ? "suspended" : "active",
  lastActiveAt: member.lastActiveAt?.toISOString() ?? null,
});

async function ensureBuiltinRoles(shopId: string) {
  if ((await prisma.role.count({ where: { shopId } })) > 0) return;
  await prisma.role.createMany({
    data: BUILTIN_ROLES.map((role) => ({ ...role, shopId, builtin: true })),
    skipDuplicates: true,
  });
}

async function findRole(shopId: string, id: string) {
  const role = await prisma.role.findFirst({ where: { id, shopId } });
  if (!role) throw new AppError(400, "ไม่พบบทบาทนี้", "ROLE_NOT_FOUND");
  return role;
}

async function findMember(shopId: string, id: string) {
  const member = await prisma.staffMember.findFirst({ where: { id, shopId } });
  if (!member) throw notFound("Staff");
  return member;
}

export const staffService = {
  async overview(shopId: string, ownerId: string) {
    await ensureBuiltinRoles(shopId);
    const [roles, members, owner] = await Promise.all([
      prisma.role.findMany({ where: { shopId }, orderBy: { createdAt: "asc" } }),
      prisma.staffMember.findMany({ where: { shopId }, orderBy: { createdAt: "asc" } }),
      prisma.user.findUniqueOrThrow({ where: { id: ownerId } }),
    ]);
    return {
      roles: [
        {
          id: OWNER_ROLE_ID,
          name: "เจ้าของร้าน",
          description: "เข้าถึงและทำได้ทุกอย่าง แก้ไขสิทธิ์ไม่ได้",
          builtin: true,
          locked: true,
          permissions: ALL_PERMISSIONS,
        },
        ...roles.map(roleDto),
      ],
      staff: [
        {
          id: OWNER_ROLE_ID,
          name: `${owner.firstName} ${owner.lastName}`.trim(),
          username: owner.email,
          mustChangePassword: false,
          roleId: OWNER_ROLE_ID,
          status: "active",
          // เจ้าของที่กำลังเรียกหน้านี้อยู่ถือว่าออนไลน์
          lastActiveAt: new Date().toISOString(),
        },
        ...members.map(staffDto),
      ],
    };
  },

  async createRole(shopId: string, { name, description, permissions }: RoleBody) {
    const dup = await prisma.role.findUnique({ where: { shopId_name: { shopId, name } } });
    if (dup) throw new AppError(409, "มีบทบาทชื่อนี้อยู่แล้ว", "DUPLICATE_ROLE");
    return roleDto(
      await prisma.role.create({
        data: { shopId, name, description, permissions: normalizePermissions(permissions) },
      }),
    );
  },

  async updateRole(shopId: string, id: string, { name, description, permissions }: RoleBody) {
    const role = await findRole(shopId, id);
    if (name !== role.name) {
      const dup = await prisma.role.findUnique({ where: { shopId_name: { shopId, name } } });
      if (dup) throw new AppError(409, "มีบทบาทชื่อนี้อยู่แล้ว", "DUPLICATE_ROLE");
    }
    return roleDto(
      await prisma.role.update({
        where: { id },
        data: { name, description, permissions: normalizePermissions(permissions) },
      }),
    );
  },

  async deleteRole(shopId: string, id: string) {
    const role = await findRole(shopId, id);
    if (role.builtin) throw new AppError(409, "บทบาทตั้งต้นของระบบลบไม่ได้", "ROLE_BUILTIN");
    const inUse = await prisma.staffMember.count({ where: { roleId: id } });
    if (inUse > 0) throw new AppError(409, `ยังมีพนักงาน ${inUse} คนใช้บทบาทนี้อยู่`, "ROLE_IN_USE");
    await prisma.role.delete({ where: { id } });
  },

  async createStaff(shopId: string, { name, username, roleId, password }: CreateStaffBody) {
    await billingService.assertWithinLimit(shopId, "staff", 1);
    await findRole(shopId, roleId);
    const dup = await prisma.staffMember.findUnique({ where: { shopId_username: { shopId, username } } });
    if (dup) throw new AppError(409, "ชื่อผู้ใช้นี้ถูกใช้แล้ว", "DUPLICATE_USERNAME");
    return staffDto(
      await prisma.staffMember.create({
        data: { shopId, name, username, roleId, passwordHash: await hashPassword(password) },
      }),
    );
  },

  async updateStaff(shopId: string, id: string, patch: UpdateStaffBody) {
    await findMember(shopId, id);
    if (patch.roleId) await findRole(shopId, patch.roleId);
    return staffDto(await prisma.staffMember.update({ where: { id }, data: patch }));
  },

  async resetPassword(shopId: string, id: string, password: string) {
    await findMember(shopId, id);
    await prisma.staffMember.update({
      where: { id },
      data: { passwordHash: await hashPassword(password), mustChangePassword: true },
    });
  },

  async deleteStaff(shopId: string, id: string) {
    await findMember(shopId, id);
    await prisma.staffMember.delete({ where: { id } });
  },
};
