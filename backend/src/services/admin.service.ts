import type { Prisma, Subscription, User } from "@prisma/client";
import type { Server } from "socket.io";
import type { z } from "zod";
import { PLANS, effectivePlan, isPlanId, loadPlans } from "@/lib/plans.js";
import { prisma } from "@/lib/prisma.js";
import { getSettings, saveSettings, type SystemSettings } from "@/lib/settings.js";
import type {
  createPlanBodySchema,
  listQuerySchema,
  subscriptionPatchSchema,
  updatePlanBodySchema,
} from "@/schemas/admin.schema.js";
import { SocketEvent, shopRoom } from "@/sockets/events.js";
import { AppError } from "@/utils/errors.js";

const DAY_MS = 86_400_000;
const iso = (date: Date | null) => date?.toISOString() ?? null;
const fullName = (user: Pick<User, "firstName" | "lastName">) => `${user.firstName} ${user.lastName}`.trim();
const bangkokDay = (date: Date) => date.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

export interface AdminActor {
  id: string;
  email: string;
}

async function log(admin: AdminActor, action: string, targetType: string, targetId: string, targetLabel: string, detail = "") {
  await prisma.adminLog.create({ data: { adminId: admin.id, adminEmail: admin.email, action, targetType, targetId, targetLabel, detail } });
}

const subscriptionView = (sub: Subscription | null) =>
  sub && {
    plan: sub.plan,
    planName: PLANS[sub.plan]?.name ?? sub.plan,
    billing: sub.billingCycle === "YEARLY" ? "yearly" : "monthly",
    status: sub.status,
    trialEndsAt: iso(sub.trialEndsAt),
    currentPeriodEnd: iso(sub.currentPeriodEnd),
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    method: sub.paymentMethod,
    /** จัดการผ่าน Stripe อยู่ การแก้ที่นี่อาจถูกทับเมื่อ Stripe ส่งสถานะใหม่ */
    stripeManaged: sub.stripeSubscriptionId !== null,
  };

/** แจ้ง client ของร้านให้ตรวจสิทธิ์ใหม่ทันที (หน้าจอที่เปิดค้างอยู่จะขึ้นหน้าต่างให้ติดต่อผู้ดูแลระบบ) และถ้าเพิกถอนก็ตัดออกจากห้อง */
function notifyAccessChanged(io: Server, shopIds: string[], revoke: boolean) {
  for (const id of shopIds) {
    io.to(shopRoom(id)).emit(SocketEvent.AccessChanged);
    if (revoke) io.in(shopRoom(id)).socketsLeave(shopRoom(id));
  }
}

function logView(row: { id: string; adminEmail: string; action: string; targetType: string; targetId: string; targetLabel: string; detail: string; createdAt: Date }) {
  return {
    id: row.id,
    admin: row.adminEmail,
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId,
    target: row.targetLabel,
    detail: row.detail,
    createdAt: row.createdAt.toISOString(),
  };
}

export const adminService = {
  async overview() {
    const now = new Date();
    const since14 = new Date(now.getTime() - 14 * DAY_MS);
    const since30 = new Date(now.getTime() - 30 * DAY_MS);
    const soon = new Date(now.getTime() + 7 * DAY_MS);
    const todayStart = new Date(`${bangkokDay(now)}T00:00:00+07:00`);

    const [owners, banned, shops, suspendedShops, subsByStatus, activeSubs, byPlan, signups, recent, expiring, sales, ordersToday] =
      await Promise.all([
        prisma.user.count({ where: { role: "OWNER" } }),
        prisma.user.count({ where: { bannedAt: { not: null } } }),
        prisma.shop.count(),
        prisma.shop.count({ where: { suspendedAt: { not: null } } }),
        prisma.subscription.groupBy({ by: ["status"], _count: true }),
        prisma.subscription.findMany({ where: { status: "ACTIVE" }, select: { plan: true, billingCycle: true } }),
        prisma.subscription.groupBy({ by: ["plan"], _count: true }),
        prisma.user.findMany({ where: { role: "OWNER", createdAt: { gte: since14 } }, select: { createdAt: true } }),
        prisma.user.findMany({
          where: { role: "OWNER" },
          orderBy: { createdAt: "desc" },
          take: 6,
          select: { id: true, email: true, firstName: true, lastName: true, createdAt: true, bannedAt: true },
        }),
        prisma.subscription.findMany({
          where: {
            OR: [
              { status: "TRIALING", trialEndsAt: { lte: soon } },
              { status: "ACTIVE", currentPeriodEnd: { lte: soon } },
            ],
          },
          orderBy: [{ trialEndsAt: "asc" }, { currentPeriodEnd: "asc" }],
          take: 8,
          include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        }),
        prisma.order.aggregate({ where: { paymentStatus: "PAID", paidAt: { gte: since30 } }, _sum: { total: true }, _count: true }),
        prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      ]);

    const statusCount = Object.fromEntries(subsByStatus.map((row) => [row.status, row._count]));
    const mrr = Math.round(
      activeSubs.reduce((sum, sub) => {
        const plan = PLANS[sub.plan];
        if (!plan) return sum;
        return sum + (sub.billingCycle === "YEARLY" ? plan.yearly / 12 : plan.monthly);
      }, 0),
    );

    const days = Array.from({ length: 14 }, (_, i) => bangkokDay(new Date(now.getTime() - (13 - i) * DAY_MS)));
    const perDay = new Map(days.map((day) => [day, 0]));
    for (const { createdAt } of signups) {
      const key = bangkokDay(createdAt);
      if (perDay.has(key)) perDay.set(key, (perDay.get(key) ?? 0) + 1);
    }

    return {
      totals: {
        owners,
        banned,
        shops,
        suspendedShops,
        trialing: statusCount.TRIALING ?? 0,
        active: statusCount.ACTIVE ?? 0,
        pastDue: statusCount.PAST_DUE ?? 0,
        canceled: statusCount.CANCELED ?? 0,
        mrr,
        ordersToday,
        sales30d: Number(sales._sum.total ?? 0),
        orders30d: sales._count,
      },
      signups: days.map((day) => ({ day, count: perDay.get(day) ?? 0 })),
      plans: byPlan.map((row) => ({ plan: row.plan, name: PLANS[row.plan]?.name ?? row.plan, count: row._count })),
      recent: recent.map((u) => ({ id: u.id, email: u.email, name: fullName(u), createdAt: u.createdAt.toISOString(), banned: u.bannedAt !== null })),
      expiring: expiring.map((sub) => ({
        userId: sub.user.id,
        email: sub.user.email,
        name: fullName(sub.user),
        status: sub.status,
        planName: PLANS[sub.plan]?.name ?? sub.plan,
        endsAt: iso(sub.status === "TRIALING" ? sub.trialEndsAt : sub.currentPeriodEnd),
      })),
    };
  },

  async listUsers(query: z.infer<typeof listQuerySchema>) {
    const { q, status, plan, page, pageSize } = query;
    const where: Prisma.UserWhereInput = { role: "OWNER" };
    if (q) {
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { shops: { some: { name: { contains: q, mode: "insensitive" } } } },
      ];
    }
    const sub: Prisma.SubscriptionWhereInput = {};
    if (status === "banned") where.bannedAt = { not: null };
    else if (["trialing", "active", "past_due", "canceled"].includes(status)) {
      sub.status = status.toUpperCase() as Subscription["status"];
    }
    if (plan) sub.plan = plan;
    if (status === "nosub") where.subscription = { is: null };
    else if (Object.keys(sub).length > 0) where.subscription = { is: sub };

    const [total, rows] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { subscription: true, _count: { select: { shops: true } } },
      }),
    ]);
    return {
      total,
      page,
      pageSize,
      items: rows.map((u) => ({
        id: u.id,
        email: u.email,
        name: fullName(u),
        verified: u.emailVerifiedAt !== null,
        createdAt: u.createdAt.toISOString(),
        banned: u.bannedAt !== null,
        banReason: u.banReason,
        shops: u._count.shops,
        subscription: subscriptionView(u.subscription),
      })),
    };
  },

  async userDetail(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        subscription: true,
        shops: {
          orderBy: { createdAt: "asc" },
          include: { _count: { select: { tables: true, staff: true, orders: true, menuItems: true } } },
        },
      },
    });
    if (!user || user.role !== "OWNER") throw new AppError(404, "ไม่พบผู้ใช้นี้", "NOT_FOUND");
    const logs = await prisma.adminLog.findMany({
      where: { OR: [{ targetType: "user", targetId: id }, { targetType: "shop", targetId: { in: user.shops.map((s) => s.id) } }] },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    const plan = effectivePlan(user.subscription?.plan ?? user.plan);
    return {
      id: user.id,
      email: user.email,
      name: fullName(user),
      verified: user.emailVerifiedAt !== null,
      createdAt: user.createdAt.toISOString(),
      banned: user.bannedAt !== null,
      bannedAt: iso(user.bannedAt),
      banReason: user.banReason,
      subscription: subscriptionView(user.subscription),
      limits: plan.limits,
      shops: user.shops.map((shop) => ({
        id: shop.id,
        name: shop.name,
        branch: shop.branch,
        isOpen: shop.isOpen,
        suspended: shop.suspendedAt !== null,
        suspendReason: shop.suspendReason,
        tables: shop._count.tables,
        staff: shop._count.staff,
        orders: shop._count.orders,
        menuItems: shop._count.menuItems,
        createdAt: shop.createdAt.toISOString(),
      })),
      logs: logs.map(logView),
    };
  },

  async banUser(io: Server, admin: AdminActor, id: string, reason: string) {
    const user = await prisma.user.findUnique({ where: { id }, include: { shops: { select: { id: true } } } });
    if (!user) throw new AppError(404, "ไม่พบผู้ใช้นี้", "NOT_FOUND");
    if (user.role === "ADMIN") throw new AppError(400, "แบนบัญชีผู้ดูแลระบบไม่ได้", "FORBIDDEN");
    await prisma.user.update({ where: { id }, data: { bannedAt: new Date(), banReason: reason } });
    notifyAccessChanged(io, user.shops.map((s) => s.id), true);
    await log(admin, "user.ban", "user", id, user.email, reason);
  },

  async unbanUser(io: Server, admin: AdminActor, id: string) {
    const user = await prisma.user.findUnique({ where: { id }, include: { shops: { select: { id: true } } } });
    if (!user) throw new AppError(404, "ไม่พบผู้ใช้นี้", "NOT_FOUND");
    await prisma.user.update({ where: { id }, data: { bannedAt: null, banReason: "" } });
    notifyAccessChanged(io, user.shops.map((s) => s.id), false);
    await log(admin, "user.unban", "user", id, user.email);
  },

  async updateSubscription(admin: AdminActor, userId: string, body: z.infer<typeof subscriptionPatchSchema>) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { subscription: true } });
    if (!user || user.role !== "OWNER") throw new AppError(404, "ไม่พบผู้ใช้นี้", "NOT_FOUND");
    if (body.plan && !isPlanId(body.plan)) throw new AppError(400, "ไม่พบแพ็กเกจนี้", "PLAN_UNAVAILABLE");

    const now = Date.now();
    const current = user.subscription;
    const plan = body.plan ?? current?.plan ?? user.plan ?? "growth";
    const cycle = body.billing ? (body.billing === "yearly" ? "YEARLY" : "MONTHLY") : (current?.billingCycle ?? "MONTHLY");
    const status = body.status ?? current?.status ?? "TRIALING";

    let trialEndsAt = body.trialEndsAt !== undefined ? (body.trialEndsAt ? new Date(body.trialEndsAt) : null) : (current?.trialEndsAt ?? null);
    let periodEnd = body.currentPeriodEnd !== undefined ? (body.currentPeriodEnd ? new Date(body.currentPeriodEnd) : null) : (current?.currentPeriodEnd ?? null);
    if (status === "TRIALING" && !trialEndsAt && !current) trialEndsAt = new Date(now + getSettings().trialDays * DAY_MS);
    // ตั้งเป็นใช้งานอยู่โดยไม่มีวันสิ้นสุด = ให้ 1 รอบบิล
    if (status === "ACTIVE" && !periodEnd) periodEnd = new Date(now + (cycle === "YEARLY" ? 365 : 30) * DAY_MS);

    if (body.extendDays) {
      const trialing = status === "TRIALING";
      const existing = trialing ? trialEndsAt : periodEnd;
      const base = body.extendDays > 0 ? Math.max(existing?.getTime() ?? now, now) : (existing?.getTime() ?? now);
      const next = new Date(base + body.extendDays * DAY_MS);
      if (trialing) trialEndsAt = next;
      else periodEnd = next;
    }

    const data = {
      plan,
      billingCycle: cycle,
      status,
      trialEndsAt,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: body.cancelAtPeriodEnd ?? current?.cancelAtPeriodEnd ?? false,
      // แพ็กเกจที่ผู้ดูแลมอบให้ (ไม่ผ่าน Stripe) นับเป็นรอบที่จ่ายแล้ว หมดรอบแล้วหมดสิทธิ์ตามปกติ
      ...(status === "ACTIVE" && !current?.stripeSubscriptionId ? { paymentMethod: "promptpay" } : {}),
    };
    const sub = await prisma.subscription.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    await prisma.user.update({ where: { id: userId }, data: { plan, billingCycle: cycle } });

    const changes = Object.entries(body)
      .map(([k, v]) => `${k}=${v === null ? "ไม่มี" : v}`)
      .join(", ");
    await log(admin, "subscription.update", "user", userId, user.email, changes);
    return subscriptionView(sub);
  },

  async listShops(query: z.infer<typeof listQuerySchema>) {
    const { q, status, page, pageSize } = query;
    const where: Prisma.ShopWhereInput = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { branch: { contains: q, mode: "insensitive" } },
        { owner: { email: { contains: q, mode: "insensitive" } } },
      ];
    }
    if (status === "suspended") where.suspendedAt = { not: null };
    else if (status === "open") where.isOpen = true;
    else if (status === "closed") where.isOpen = false;

    const [total, rows] = await Promise.all([
      prisma.shop.count({ where }),
      prisma.shop.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          owner: { select: { id: true, email: true, firstName: true, lastName: true, bannedAt: true } },
          _count: { select: { tables: true, staff: true, orders: true } },
        },
      }),
    ]);
    return {
      total,
      page,
      pageSize,
      items: rows.map((shop) => ({
        id: shop.id,
        name: shop.name,
        branch: shop.branch,
        isOpen: shop.isOpen,
        suspended: shop.suspendedAt !== null,
        suspendReason: shop.suspendReason,
        createdAt: shop.createdAt.toISOString(),
        tables: shop._count.tables,
        staff: shop._count.staff,
        orders: shop._count.orders,
        owner: { id: shop.owner.id, email: shop.owner.email, name: fullName(shop.owner), banned: shop.owner.bannedAt !== null },
      })),
    };
  },

  async setShopSuspended(io: Server, admin: AdminActor, id: string, suspended: boolean, reason: string) {
    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new AppError(404, "ไม่พบร้านนี้", "NOT_FOUND");
    await prisma.shop.update({
      where: { id },
      data: suspended ? { suspendedAt: new Date(), suspendReason: reason } : { suspendedAt: null, suspendReason: "" },
    });
    notifyAccessChanged(io, [id], suspended);
    const label = shop.branch ? `${shop.name} (${shop.branch})` : shop.name;
    await log(admin, suspended ? "shop.suspend" : "shop.unsuspend", "shop", id, label, reason);
  },

  async listPlans() {
    const [rows, counts] = await Promise.all([
      prisma.plan.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
      prisma.subscription.groupBy({ by: ["plan"], _count: true }),
    ]);
    const subscribers = new Map(counts.map((row) => [row.plan, row._count]));
    return rows.map(({ createdAt: _c, updatedAt: _u, ...plan }) => ({ ...plan, subscribers: subscribers.get(plan.id) ?? 0 }));
  },

  async createPlan(admin: AdminActor, body: z.infer<typeof createPlanBodySchema>) {
    if (await prisma.plan.findUnique({ where: { id: body.id } })) throw new AppError(409, "รหัสแพ็กเกจนี้มีอยู่แล้ว", "DUPLICATE_PLAN");
    await prisma.plan.create({ data: body });
    await loadPlans();
    await log(admin, "plan.create", "plan", body.id, body.name, `${body.monthly}/${body.yearly}`);
  },

  async updatePlan(admin: AdminActor, id: string, body: z.infer<typeof updatePlanBodySchema>) {
    const plan = await prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new AppError(404, "ไม่พบแพ็กเกจนี้", "NOT_FOUND");
    if (!body.active && plan.active && (await prisma.plan.count({ where: { active: true } })) <= 1) {
      throw new AppError(409, "ต้องมีแพ็กเกจที่เปิดขายอย่างน้อย 1 แพ็กเกจ", "LAST_PLAN");
    }
    await prisma.plan.update({ where: { id }, data: body });
    await loadPlans();
    await log(admin, "plan.update", "plan", id, body.name, `${body.monthly}/${body.yearly}${body.active ? "" : " (ปิดขาย)"}`);
  },

  async deletePlan(admin: AdminActor, id: string) {
    const plan = await prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new AppError(404, "ไม่พบแพ็กเกจนี้", "NOT_FOUND");
    const users = await prisma.subscription.count({ where: { plan: id } });
    if (users > 0) throw new AppError(409, `มีผู้ใช้ ${users} รายใช้แพ็กเกจนี้อยู่ ปิดขายแทนการลบ`, "PLAN_IN_USE");
    if (plan.active && (await prisma.plan.count({ where: { active: true } })) <= 1) {
      throw new AppError(409, "ต้องมีแพ็กเกจที่เปิดขายอย่างน้อย 1 แพ็กเกจ", "LAST_PLAN");
    }
    await prisma.plan.delete({ where: { id } });
    await loadPlans();
    await log(admin, "plan.delete", "plan", id, plan.name);
  },

  settings: () => getSettings(),

  async updateSettings(admin: AdminActor, body: SystemSettings) {
    const saved = await saveSettings(body);
    await log(admin, "settings.update", "system", "settings", "ตั้งค่าระบบ", `ทดลองฟรี ${body.trialDays} วัน, รายปีแถม ${body.yearlyFreeMonths} เดือน`);
    return saved;
  },

  async logs(page: number, pageSize: number) {
    const [total, rows] = await Promise.all([
      prisma.adminLog.count(),
      prisma.adminLog.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    ]);
    return { total, page, pageSize, items: rows.map(logView) };
  },
};
