import type { BillingCycle, Subscription, SubscriptionStatus } from "@prisma/client";
import type Stripe from "stripe";
import { env } from "@/config/env.js";
import { effectivePlan, isPlanId, PLANS, TRIAL_DAYS, type Cycle, type PlanId } from "@/lib/plans.js";
import { prisma } from "@/lib/prisma.js";
import { stripe } from "@/lib/stripe.js";
import { AppError } from "@/utils/errors.js";

const DAY_MS = 86_400_000;
/** Stripe รับ trial_end ที่อยู่ในอนาคตอย่างน้อย 48 ชั่วโมง */
const MIN_TRIAL_END_MS = 2 * DAY_MS + 3_600_000;

const toCycle = (value: BillingCycle): Cycle => (value === "YEARLY" ? "yearly" : "monthly");
const fromCycle = (value: Cycle): BillingCycle => (value === "yearly" ? "YEARLY" : "MONTHLY");
const unix = (seconds: number | null | undefined) => (seconds ? new Date(seconds * 1000) : null);

export type PayMethod = "card" | "promptpay";

/** รอบบิลที่จ่ายด้วยพร้อมเพย์ยังไม่หมดอายุ */
const promptpayActive = (sub: Subscription) =>
  sub.paymentMethod === "promptpay" &&
  sub.status === "ACTIVE" &&
  sub.currentPeriodEnd !== null &&
  sub.currentPeriodEnd.getTime() > Date.now();

export const subscriptionDto = (sub: Subscription) => ({
  plan: sub.plan,
  billing: toCycle(sub.billingCycle),
  status: sub.status,
  trialEndsAt: sub.trialEndsAt?.toISOString() ?? null,
  currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
  cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
  /** มีแพ็กเกจแบบชำระเงินที่ใช้งานอยู่ (ตัดบัตรอัตโนมัติ หรือจ่ายพร้อมเพย์ที่ยังไม่หมดอายุ) */
  paying: sub.stripeSubscriptionId !== null || promptpayActive(sub),
  /** วิธีชำระล่าสุด */
  method: (sub.paymentMethod as PayMethod | null) ?? null,
  /** ตัดบัตรอัตโนมัติทุกรอบ (ไม่ใช่ = ต้องต่ออายุเอง) */
  autoRenew: sub.stripeSubscriptionId !== null,
});

/** สมัครแบบตัดบัตรอัตโนมัติกับ Stripe และยังไม่ถูกยกเลิก */
const livePaying = (sub: Subscription) =>
  sub.stripeSubscriptionId !== null && (sub.status === "ACTIVE" || sub.status === "PAST_DUE" || sub.status === "TRIALING");

async function ownerOf(userId: string) {
  return prisma.user.findUniqueOrThrow({ where: { id: userId } });
}

/** สร้างช่วงทดลองให้ถ้ายังไม่มี (บัญชีเก่าที่เลือกแพ็กเกจไว้ก่อนมีระบบนี้นับจากวันสมัคร) */
async function getOrCreate(userId: string) {
  const existing = await prisma.subscription.findUnique({ where: { userId } });
  if (existing) {
    // แพ็กเกจที่จ่ายพร้อมเพย์หมดรอบแล้ว = หมดอายุ (ไม่มีการตัดเงินอัตโนมัติให้ต่อเอง)
    if (
      existing.paymentMethod === "promptpay" &&
      existing.status === "ACTIVE" &&
      existing.currentPeriodEnd &&
      existing.currentPeriodEnd.getTime() <= Date.now()
    ) {
      return prisma.subscription.update({ where: { userId }, data: { status: "CANCELED" } });
    }
    return existing;
  }
  const user = await ownerOf(userId);
  return prisma.subscription.create({
    data: {
      userId,
      plan: isPlanId(user.plan) ? user.plan : "growth",
      billingCycle: user.billingCycle ?? "YEARLY",
      status: "TRIALING",
      trialEndsAt: new Date(user.createdAt.getTime() + TRIAL_DAYS * DAY_MS),
    },
  });
}

/** price ของ Stripe ต่อแพ็กเกจ+รอบบิล สร้างครั้งแรกที่ใช้แล้วหาซ้ำด้วย lookup_key (ราคาตรงกับ PLANS เสมอ) */
async function ensurePrice(plan: PlanId, cycle: Cycle) {
  const lookupKey = `sharkzen_${plan}_${cycle}`;
  const found = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  if (found.data[0]) return found.data[0].id;

  const def = PLANS[plan];
  const price = await stripe.prices.create({
    currency: "thb",
    unit_amount: (cycle === "yearly" ? def.yearly : def.monthly) * 100,
    recurring: { interval: cycle === "yearly" ? "year" : "month" },
    lookup_key: lookupKey,
    transfer_lookup_key: true,
    product_data: { name: `SHARKZEN ORDER แพ็กเกจ${def.name} (${cycle === "yearly" ? "รายปี" : "รายเดือน"})` },
  });
  return price.id;
}

const PROMPTPAY_CONFIG_NAME = "sharkzen-plan-promptpay-only";

/**
 * ชุดตั้งค่าวิธีชำระที่มีแต่พร้อมเพย์ (ปิดบัตร) เพราะ Stripe รุ่นนี้ไม่รับ payment_method_types แล้ว
 * สร้างครั้งแรกที่ใช้ แล้วหาซ้ำด้วยชื่อ ต้องเปิด PromptPay ที่ Dashboard > Settings > Payment methods ไว้ก่อน
 */
async function ensurePromptpayConfig() {
  const list = await stripe.paymentMethodConfigurations.list({ limit: 100 });
  const found = list.data.find((config) => config.name === PROMPTPAY_CONFIG_NAME);
  if (found) return found.id;
  const created = await stripe.paymentMethodConfigurations.create({
    name: PROMPTPAY_CONFIG_NAME,
    card: { display_preference: { preference: "off" } },
    promptpay: { display_preference: { preference: "on" } },
  });
  return created.id;
}

async function ensureCustomer(userId: string, sub: Subscription) {
  if (sub.stripeCustomerId) return sub.stripeCustomerId;
  const user = await ownerOf(userId);
  const customer = await stripe.customers.create({
    email: user.email,
    name: `${user.firstName} ${user.lastName}`.trim(),
    metadata: { userId },
  });
  await prisma.subscription.update({ where: { userId }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

function statusFromStripe(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    default:
      return "CANCELED";
  }
}

/** ซิงก์สถานะการสมัครจาก Stripe มาที่ฐานข้อมูล (ใช้ทั้งจาก webhook และตอนกลับจากหน้าชำระเงิน) */
async function applyStripeSubscription(stripeSub: Stripe.Subscription, fallbackUserId?: string) {
  const userId = stripeSub.metadata?.userId ?? fallbackUserId;
  const existing = userId
    ? await prisma.subscription.findUnique({ where: { userId } })
    : await prisma.subscription.findUnique({ where: { stripeSubscriptionId: stripeSub.id } });
  if (!existing) return null;

  const plan = isPlanId(stripeSub.metadata?.plan) ? stripeSub.metadata.plan : existing.plan;
  const billing = stripeSub.metadata?.billing === "monthly" || stripeSub.metadata?.billing === "yearly"
    ? fromCycle(stripeSub.metadata.billing)
    : existing.billingCycle;
  const status = statusFromStripe(stripeSub.status);
  const periodEnd = unix(stripeSub.items.data[0]?.current_period_end);

  const updated = await prisma.subscription.update({
    where: { id: existing.id },
    data: {
      plan,
      billingCycle: billing,
      status,
      stripeSubscriptionId: stripeSub.id,
      paymentMethod: "card",
      stripeCustomerId: typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer.id,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      trialEndsAt: status === "TRIALING" ? unix(stripeSub.trial_end) : existing.trialEndsAt,
    },
  });
  // ให้ฟิลด์เดิมบนผู้ใช้ตรงกันไว้ด้วย (หน้าอื่นอ่านจาก user.plan)
  await prisma.user.update({ where: { id: updated.userId }, data: { plan: updated.plan, billingCycle: updated.billingCycle } });
  return updated;
}

export const billingService = {
  /** ตรวจลายเซ็น webhook ของ Stripe */
  constructEvent(rawBody: Buffer, signature: string | undefined) {
    if (!env.STRIPE_WEBHOOK_SECRET) throw new AppError(500, "STRIPE_WEBHOOK_SECRET is not set");
    if (!signature) throw new AppError(400, "Missing stripe-signature header");
    try {
      return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch {
      throw new AppError(400, "Invalid webhook signature");
    }
  },

  /** เลือกแพ็กเกจตอนสมัคร/ออนบอร์ดดิ้ง: เริ่มทดลองฟรี (ยังไม่ผูกบัตร) หรือเปลี่ยนแพ็กเกจที่ทดลองอยู่ */
  async selectTrialPlan(userId: string, plan: PlanId, billing: Cycle) {
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (sub && (livePaying(sub) || promptpayActive(sub))) return sub;
    if (sub) {
      return prisma.subscription.update({ where: { userId }, data: { plan, billingCycle: fromCycle(billing) } });
    }
    return prisma.subscription.create({
      data: {
        userId,
        plan,
        billingCycle: fromCycle(billing),
        status: "TRIALING",
        trialEndsAt: new Date(Date.now() + TRIAL_DAYS * DAY_MS),
      },
    });
  },

  async overview(userId: string, shopId: string) {
    const sub = await getOrCreate(userId);
    const [tables, staff] = await Promise.all([
      prisma.table.count({ where: { shopId } }),
      prisma.staffMember.count({ where: { shopId } }),
    ]);
    return {
      subscription: subscriptionDto(sub),
      usage: { tables, staff },
      limits: effectivePlan(sub.plan).limits,
    };
  },

  /**
   * ไปหน้าชำระเงินของ Stripe
   * - card: สมัครแบบตัดบัตรอัตโนมัติทุกรอบ (ช่วงทดลองหรือรอบพร้อมเพย์ที่เหลือจะไม่ถูกเก็บซ้ำ เริ่มตัดเมื่อหมดช่วงนั้น)
   * - promptpay: จ่ายครั้งเดียวต่อ 1 รอบบิล (1 เดือน หรือ 12 เดือน) แล้วต่ออายุเองเมื่อใกล้หมด
   */
  async createCheckout(userId: string, plan: PlanId, cycle: Cycle, method: PayMethod) {
    const sub = await getOrCreate(userId);
    if (livePaying(sub)) {
      throw new AppError(409, "คุณสมัครแบบตัดบัตรอัตโนมัติอยู่แล้ว ใช้ปุ่มเปลี่ยนแพ็กเกจแทน", "ALREADY_SUBSCRIBED");
    }
    const customer = await ensureCustomer(userId, sub);
    const metadata = { userId, plan, billing: cycle };
    const returnUrls = {
      success_url: `${env.FRONTEND_URL}/plan?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.FRONTEND_URL}/plan?checkout=cancelled`,
    };

    if (method === "promptpay") {
      const def = PLANS[plan];
      try {
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          customer,
          payment_method_configuration: await ensurePromptpayConfig(),
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: "thb",
                unit_amount: (cycle === "yearly" ? def.yearly : def.monthly) * 100,
                product_data: {
                  name: `SHARKZEN ORDER แพ็กเกจ${def.name} (${cycle === "yearly" ? "12 เดือน" : "1 เดือน"})`,
                },
              },
            },
          ],
          client_reference_id: userId,
          metadata: { ...metadata, kind: "plan_payment" },
          // การจ่ายครั้งเดียวไม่ออกใบแจ้งหนี้เอง ต้องสั่งให้ออก จะได้มีเลขที่และ PDF ในประวัติ
          invoice_creation: { enabled: true },
          ...returnUrls,
        });
        return { url: session.url };
      } catch (error) {
        console.error("PromptPay checkout failed:", error instanceof Error ? error.message : error);
        throw new AppError(
          503,
          "ยังจ่ายด้วยพร้อมเพย์ไม่ได้ (ต้องเปิด PromptPay ที่ Stripe Dashboard > Settings > Payment methods) เลือกจ่ายด้วยบัตรแทนได้",
          "PROMPTPAY_NOT_ENABLED",
        );
      }
    }

    const price = await ensurePrice(plan, cycle);
    // ไม่เก็บซ้ำในช่วงที่จ่ายหรือทดลองไว้แล้ว: เริ่มตัดบัตรตอนสิ้นสุดช่วงนั้น
    const coveredUntil = Math.max(
      sub.status === "TRIALING" ? (sub.trialEndsAt?.getTime() ?? 0) : 0,
      promptpayActive(sub) ? (sub.currentPeriodEnd?.getTime() ?? 0) : 0,
    );
    const keepCover = coveredUntil - Date.now() >= MIN_TRIAL_END_MS;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer,
      line_items: [{ price, quantity: 1 }],
      client_reference_id: userId,
      metadata: { userId, kind: "subscription" },
      subscription_data: {
        metadata,
        ...(keepCover && { trial_end: Math.floor(coveredUntil / 1000) }),
      },
      ...returnUrls,
    });
    return { url: session.url };
  },

  /** บันทึกการจ่ายพร้อมเพย์: ต่ออายุแพ็กเกจ 1 รอบ (ต่อท้ายรอบเดิมถ้าเป็นแพ็กเกจเดียวกันและยังไม่หมด) */
  async applyPlanPayment(session: Stripe.Checkout.Session) {
    const userId = session.client_reference_id;
    const plan = session.metadata?.plan;
    const billing = session.metadata?.billing;
    if (!userId || !isPlanId(plan) || (billing !== "monthly" && billing !== "yearly")) return null;
    if (session.payment_status !== "paid") {
      throw new AppError(409, "การชำระเงินยังไม่เสร็จสมบูรณ์", "CHECKOUT_INCOMPLETE");
    }

    const sub = await getOrCreate(userId);
    if (sub.lastCheckoutSessionId === session.id) return sub; // ประมวลผลไปแล้ว

    const sameRunning = promptpayActive(sub) && sub.plan === plan && sub.billingCycle === fromCycle(billing);
    const start = sameRunning && sub.currentPeriodEnd ? sub.currentPeriodEnd : new Date();
    const end = new Date(start);
    if (billing === "yearly") end.setFullYear(end.getFullYear() + 1);
    else end.setMonth(end.getMonth() + 1);

    const updated = await prisma.subscription.update({
      where: { userId },
      data: {
        plan,
        billingCycle: fromCycle(billing),
        status: "ACTIVE",
        paymentMethod: "promptpay",
        currentPeriodEnd: end,
        trialEndsAt: null,
        cancelAtPeriodEnd: false,
        lastCheckoutSessionId: session.id,
      },
    });
    await prisma.user.update({ where: { id: userId }, data: { plan, billingCycle: updated.billingCycle } });
    return updated;
  },

  /** กลับจากหน้าชำระเงิน: ดึงสถานะล่าสุดจาก Stripe มาบันทึกทันที (ไม่ต้องรอ webhook) */
  async syncCheckout(userId: string, sessionId: string) {
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
    if (session.client_reference_id !== userId) throw new AppError(403, "ไม่พบรายการชำระเงินนี้", "FORBIDDEN");
    if (session.mode === "payment") {
      return subscriptionDto((await this.applyPlanPayment(session)) ?? (await getOrCreate(userId)));
    }
    if (!session.subscription || typeof session.subscription === "string") {
      throw new AppError(409, "การชำระเงินยังไม่เสร็จสมบูรณ์", "CHECKOUT_INCOMPLETE");
    }
    return subscriptionDto((await applyStripeSubscription(session.subscription, userId)) ?? (await getOrCreate(userId)));
  },

  /** เปลี่ยนแพ็กเกจ/รอบบิลของคนที่สมัครอยู่แล้ว Stripe คิดส่วนต่างตามสัดส่วนให้ */
  async changePlan(userId: string, plan: PlanId, cycle: Cycle) {
    const sub = await getOrCreate(userId);
    if (!sub.stripeSubscriptionId || !livePaying(sub)) {
      throw new AppError(409, "ยังไม่ได้สมัครแพ็กเกจแบบชำระเงิน", "NOT_SUBSCRIBED");
    }
    // ลดแพ็กเกจไม่ได้ถ้าการใช้งานตอนนี้เกินเพดานของแพ็กเกจปลายทาง
    const shop = await prisma.shop.findUnique({ where: { ownerId: userId }, select: { id: true } });
    if (shop) {
      const limits = PLANS[plan].limits;
      const [tables, staff] = await Promise.all([
        prisma.table.count({ where: { shopId: shop.id } }),
        prisma.staffMember.count({ where: { shopId: shop.id } }),
      ]);
      if (limits.tables !== null && tables > limits.tables) {
        throw new AppError(409, `ตอนนี้มี ${tables} โต๊ะ แพ็กเกจ${PLANS[plan].name}มีได้ไม่เกิน ${limits.tables} ลดโต๊ะก่อน`, "PLAN_LIMIT");
      }
      if (limits.staff !== null && staff > limits.staff) {
        throw new AppError(409, `ตอนนี้มีพนักงาน ${staff} คน แพ็กเกจ${PLANS[plan].name}มีได้ไม่เกิน ${limits.staff} ลดก่อน`, "PLAN_LIMIT");
      }
    }
    const current = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
    const item = current.items.data[0];
    if (!item) throw new AppError(409, "ไม่พบรายการสมัครใน Stripe", "NOT_SUBSCRIBED");
    const price = await ensurePrice(plan, cycle);

    const updated = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      items: [{ id: item.id, price }],
      cancel_at_period_end: false,
      proration_behavior: "create_prorations",
      metadata: { userId, plan, billing: cycle },
    });
    return subscriptionDto((await applyStripeSubscription(updated, userId)) ?? sub);
  },

  /** ยกเลิก = ใช้ต่อได้จนสิ้นรอบบิล / resume = ยกเลิกการยกเลิก */
  async setCancelAtPeriodEnd(userId: string, cancel: boolean) {
    const sub = await getOrCreate(userId);
    if (!sub.stripeSubscriptionId || !livePaying(sub)) {
      throw new AppError(409, "ยังไม่ได้สมัครแพ็กเกจแบบชำระเงิน", "NOT_SUBSCRIBED");
    }
    const updated = await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: cancel });
    return subscriptionDto((await applyStripeSubscription(updated, userId)) ?? sub);
  },

  /** หน้าจัดการบัตรและใบแจ้งหนี้ของ Stripe (ต้องเปิดใช้ Customer portal ใน Stripe dashboard ก่อน) */
  async portal(userId: string) {
    const sub = await getOrCreate(userId);
    if (!sub.stripeCustomerId) throw new AppError(409, "ยังไม่มีข้อมูลการชำระเงิน", "NO_CUSTOMER");
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: sub.stripeCustomerId,
        return_url: `${env.FRONTEND_URL}/plan`,
      });
      return { url: session.url };
    } catch {
      throw new AppError(
        503,
        "ยังเปิดหน้าจัดการการชำระเงินไม่ได้ (ต้องตั้งค่า Customer portal ใน Stripe dashboard)",
        "PORTAL_NOT_CONFIGURED",
      );
    }
  },

  /**
   * ประวัติการชำระเงินแพ็กเกจ รวม 2 แหล่ง
   * - ใบแจ้งหนี้ของ Stripe (ตัดบัตรอัตโนมัติ และพร้อมเพย์ที่ออกใบแจ้งหนี้) ไม่นับใบที่ยอด 0 บาทของช่วงทดลอง
   * - การจ่ายพร้อมเพย์ครั้งเดียวที่ยังไม่มีใบแจ้งหนี้ (รายการเก่าก่อนเปิดออกใบแจ้งหนี้) ใช้ใบเสร็จของ Stripe แทน
   */
  async invoices(userId: string) {
    const sub = await getOrCreate(userId);
    if (!sub.stripeCustomerId) return [];

    const [invoices, sessions] = await Promise.all([
      stripe.invoices.list({ customer: sub.stripeCustomerId, limit: 24 }),
      stripe.checkout.sessions.list({
        customer: sub.stripeCustomerId,
        limit: 24,
        expand: ["data.payment_intent.latest_charge"],
      }),
    ]);

    const fromInvoices = invoices.data
      .filter((invoice) => invoice.total > 0)
      .map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        description: invoice.lines.data[0]?.description ?? null,
        date: new Date(invoice.created * 1000).toISOString(),
        amount: (invoice.amount_paid > 0 ? invoice.amount_paid : invoice.total) / 100,
        status: invoice.status,
        pdfUrl: invoice.invoice_pdf ?? null,
        hostedUrl: invoice.hosted_invoice_url ?? null,
      }));

    const fromPayments = sessions.data
      .filter((session) => session.mode === "payment" && session.payment_status === "paid" && session.metadata?.kind === "plan_payment" && !session.invoice)
      .map((session) => {
        const intent = typeof session.payment_intent === "object" ? session.payment_intent : null;
        const charge = intent && typeof intent.latest_charge === "object" ? intent.latest_charge : null;
        const plan = isPlanId(session.metadata?.plan) ? PLANS[session.metadata.plan].name : "";
        const months = session.metadata?.billing === "yearly" ? "12 เดือน" : "1 เดือน";
        return {
          id: session.id,
          number: null,
          description: `แพ็กเกจ${plan} (${months}) • พร้อมเพย์`,
          date: new Date(session.created * 1000).toISOString(),
          amount: (session.amount_total ?? 0) / 100,
          status: "paid" as const,
          pdfUrl: null,
          hostedUrl: charge?.receipt_url ?? null,
        };
      });

    return [...fromInvoices, ...fromPayments].sort((x, y) => y.date.localeCompare(x.date));
  },

  /** webhook ของ Stripe: คืน true เมื่อเป็นเหตุการณ์การสมัครแพ็กเกจและจัดการแล้ว */
  async handleEvent(event: Stripe.Event) {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await applyStripeSubscription(event.data.object);
        return true;
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "payment" && session.metadata?.kind === "plan_payment") {
          await this.applyPlanPayment(session);
          return true;
        }
        if (session.mode !== "subscription" || !session.subscription) return false;
        const id = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        await applyStripeSubscription(await stripe.subscriptions.retrieve(id), session.client_reference_id ?? undefined);
        return true;
      }
      default:
        return false;
    }
  },

  /** ตรวจเพดานตามแพ็กเกจก่อนเพิ่มโต๊ะ/พนักงาน */
  async assertWithinLimit(shopId: string, kind: "tables" | "staff", adding: number) {
    const shop = await prisma.shop.findUniqueOrThrow({ where: { id: shopId }, select: { ownerId: true } });
    const sub = await getOrCreate(shop.ownerId);
    const plan = effectivePlan(sub.plan);
    const limit = plan.limits[kind];
    if (limit === null) return;
    const current =
      kind === "tables"
        ? await prisma.table.count({ where: { shopId } })
        : await prisma.staffMember.count({ where: { shopId } });
    if (current + adding > limit) {
      const label = kind === "tables" ? "โต๊ะ" : "บัญชีพนักงาน";
      throw new AppError(
        403,
        `แพ็กเกจ${plan.name}มี${label}ได้สูงสุด ${limit} (ตอนนี้ ${current}) อัปเกรดแพ็กเกจเพื่อเพิ่ม`,
        "PLAN_LIMIT",
      );
    }
  },
};
