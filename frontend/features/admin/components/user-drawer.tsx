"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Ban, CalendarPlus, CircleAlert, Store, X } from "lucide-react";
import { Badge, Button, Card, ConfirmDialog, FormField, Input, Select, Skeleton } from "@/components/ui";
import { useResource } from "@/hooks/use-resource";
import { cn } from "@/lib/cn";
import { notify } from "@/lib/toast";
import {
  adminApi,
  type AdminPlan,
  type Billing,
  type SubStatus,
  type UserDetail,
  type UserShop,
} from "../lib/admin-api";
import {
  ACTION_LABEL,
  countdownLabel,
  formatDate,
  formatDateTime,
  fromDateInput,
  limitLabel,
  STATUS_LABEL,
  toDateInput,
} from "../lib/format";
import { ReasonDialog } from "./reason-dialog";
import { BannedBadge, SubscriptionBadge, SuspendedBadge, VerifiedBadge } from "./user-badges";

interface UserDrawerProps {
  userId: string | null;
  plans: AdminPlan[];
  onClose: () => void;
  /** มีการแก้ข้อมูลที่กระทบรายการผู้ใช้ (ให้ตารางโหลดใหม่) */
  onChanged: () => void;
}

const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as SubStatus[]).map((value) => ({ value, label: STATUS_LABEL[value] }));
const BILLING_OPTIONS = [
  { value: "monthly", label: "รายเดือน" },
  { value: "yearly", label: "รายปี" },
];
const QUICK_DAYS = [-7, 7, 14, 30, 365];

function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-foreground text-sm font-semibold">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** แผงรายละเอียดผู้ใช้ที่เลื่อนออกมาจากขวา: แบน/ปลดแบน จัดการแพ็กเกจและวัน ระงับแต่ละสาขา และดูประวัติ */
export function UserDrawer({ userId, plans, onClose, onChanged }: UserDrawerProps) {
  useEffect(() => {
    if (!userId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [userId, onClose]);

  return (
    <AnimatePresence>
      {userId && (
        <div className="fixed inset-0 z-50">
          <m.div
            className="absolute inset-0 bg-[#0a1d3a]/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <m.aside
            role="dialog"
            aria-modal="true"
            aria-label="รายละเอียดผู้ใช้"
            className="bg-background shadow-float scroll-thin absolute inset-y-0 right-0 flex w-[560px] max-w-full flex-col overflow-y-auto"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <DrawerBody key={userId} userId={userId} plans={plans} onClose={onClose} onChanged={onChanged} />
          </m.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

function DrawerBody({ userId, plans, onClose, onChanged }: Omit<UserDrawerProps, "userId"> & { userId: string }) {
  const { data, error, reload } = useResource((signal) => adminApi.user(userId, signal));

  function changed() {
    reload();
    onChanged();
  }

  return (
    <>
      <div className="border-border bg-surface sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-5 py-4">
        <p className="font-display text-foreground text-lg font-semibold">รายละเอียดผู้ใช้</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิด"
          className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-primary/50 flex size-9 cursor-pointer items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:outline-none"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <CircleAlert className="text-danger size-8" aria-hidden />
          <p className="text-foreground text-sm font-semibold">{error}</p>
          <Button variant="outline" size="sm" onClick={reload}>
            ลองใหม่
          </Button>
        </div>
      ) : !data ? (
        <Skeleton className="p-5">
          <div className="flex flex-col gap-6">
            <div className="h-20 rounded-xl border" />
            <div className="h-72 rounded-xl border" />
            <div className="h-40 rounded-xl border" />
          </div>
        </Skeleton>
      ) : (
        <div className="flex flex-col gap-6 p-5">
          <Profile user={data} onChanged={changed} />
          <SubscriptionEditor key={JSON.stringify(data.subscription)} user={data} plans={plans} onChanged={changed} />
          <Shops user={data} onChanged={changed} />
          <History user={data} />
        </div>
      )}
    </>
  );
}

function Profile({ user, onChanged }: { user: UserDetail; onChanged: () => void }) {
  const [banOpen, setBanOpen] = useState(false);
  const [unbanOpen, setUnbanOpen] = useState(false);

  async function ban(reason: string) {
    try {
      await adminApi.ban(user.id, reason);
      notify.success("แบนผู้ใช้แล้ว", "เจ้าของร้าน พนักงาน และลูกค้าหน้าโต๊ะของทุกสาขาใช้งานไม่ได้ทันที");
      setBanOpen(false);
      onChanged();
    } catch (e) {
      notify.error(e);
    }
  }

  async function unban() {
    try {
      await adminApi.unban(user.id);
      notify.success("ปลดแบนแล้ว", "ผู้ใช้เข้าสู่ระบบและใช้งานร้านได้อีกครั้ง");
      setUnbanOpen(false);
      onChanged();
    } catch (e) {
      notify.error(e);
    }
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3.5">
        <span aria-hidden className="bg-primary-soft text-primary-strong flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-bold">
          {(user.name || user.email).slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-base font-semibold">{user.name || "-"}</p>
          <p className="text-muted-foreground truncate text-sm">{user.email}</p>
          <p className="text-muted-foreground mt-1 text-xs">สมัครเมื่อ {formatDate(user.createdAt)}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {user.banned && <BannedBadge />}
        <SubscriptionBadge subscription={user.subscription} />
        <VerifiedBadge verified={user.verified} />
      </div>

      {user.banned && (
        <div className="bg-danger-soft rounded-lg px-4 py-3">
          <p className="text-danger-strong text-xs font-semibold">ถูกแบนเมื่อ {user.bannedAt ? formatDateTime(user.bannedAt) : "-"}</p>
          <p className="text-foreground mt-0.5 text-sm break-words">{user.banReason || "ไม่ได้ระบุเหตุผล"}</p>
        </div>
      )}

      {user.banned ? (
        <Button variant="secondary" onClick={() => setUnbanOpen(true)}>
          ปลดแบนผู้ใช้นี้
        </Button>
      ) : (
        <Button variant="outline" className="text-danger-strong border-danger/30 hover:bg-danger-soft" onClick={() => setBanOpen(true)}>
          <Ban className="size-4" aria-hidden />
          แบนผู้ใช้นี้
        </Button>
      )}

      <ReasonDialog
        open={banOpen}
        title="แบนผู้ใช้นี้?"
        description={`ทุกสาขาของ ${user.email} จะใช้งานไม่ได้ทันที: เจ้าของและพนักงานเข้าระบบไม่ได้ ลูกค้าสแกน QR สั่งอาหารไม่ได้ และจะเห็นหน้าต่างให้ติดต่อผู้ดูแลระบบ ปลดแบนได้ภายหลังโดยข้อมูลไม่หาย`}
        confirmLabel="ยืนยันแบน"
        onClose={() => setBanOpen(false)}
        onConfirm={ban}
      />
      <ConfirmDialog
        open={unbanOpen}
        title="ปลดแบนผู้ใช้นี้?"
        description="ผู้ใช้จะเข้าสู่ระบบได้อีกครั้ง และร้านทุกสาขา (ที่ไม่ได้ถูกระงับแยก) กลับมาใช้งานได้"
        confirmLabel="ปลดแบน"
        onConfirm={unban}
        onCancel={() => setUnbanOpen(false)}
      />
    </Card>
  );
}

function SubscriptionEditor({ user, plans, onChanged }: { user: UserDetail; plans: AdminPlan[]; onChanged: () => void }) {
  const sub = user.subscription;
  const [plan, setPlan] = useState(sub?.plan ?? plans.find((p) => p.active)?.id ?? "");
  const [billing, setBilling] = useState<Billing>(sub?.billing ?? "monthly");
  const [status, setStatus] = useState<SubStatus>(sub?.status ?? "TRIALING");
  const endIso = status === "TRIALING" ? (sub?.trialEndsAt ?? null) : (sub?.currentPeriodEnd ?? null);
  const [endDate, setEndDate] = useState(toDateInput(endIso));
  const [saving, setSaving] = useState(false);
  const [extending, setExtending] = useState<number>();

  const planOptions = plans.map((p) => ({ value: p.id, label: p.active ? p.name : `${p.name} (ปิดขาย)` }));
  const endLabel = status === "TRIALING" ? "วันสิ้นสุดช่วงทดลอง" : "วันสิ้นสุดรอบบิล";

  async function save() {
    setSaving(true);
    try {
      await adminApi.updateSubscription(user.id, {
        plan,
        billing,
        status,
        ...(status === "TRIALING" ? { trialEndsAt: fromDateInput(endDate) } : { currentPeriodEnd: fromDateInput(endDate) }),
      });
      notify.success("บันทึกแพ็กเกจแล้ว");
      onChanged();
    } catch (e) {
      notify.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function extend(days: number) {
    setExtending(days);
    try {
      await adminApi.updateSubscription(user.id, { extendDays: days });
      notify.success(days > 0 ? `เพิ่ม ${days} วันแล้ว` : `ลด ${-days} วันแล้ว`);
      onChanged();
    } catch (e) {
      notify.error(e);
    } finally {
      setExtending(undefined);
    }
  }

  return (
    <Card className="flex flex-col gap-5 p-5">
      <Section
        title="แพ็กเกจและวันใช้งาน"
        aside={sub && <Badge tone="neutral">{countdownLabel(endIso)}</Badge>}
      >
        {sub?.stripeManaged && (
          <p className="bg-warning-soft text-warning-strong flex gap-2 rounded-lg px-3 py-2.5 text-xs">
            <CircleAlert className="mt-px size-4 shrink-0" aria-hidden />
            บัญชีนี้ตัดบัตรอัตโนมัติผ่าน Stripe การแก้ที่นี่เปลี่ยนเฉพาะสิทธิ์ในระบบ และอาจถูกทับเมื่อ Stripe ส่งสถานะรอบบิลใหม่
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="แพ็กเกจ" htmlFor="sub-plan">
            <Select id="sub-plan" value={plan} onChange={setPlan} options={planOptions} />
          </FormField>
          <FormField label="รอบบิล" htmlFor="sub-billing">
            <Select id="sub-billing" value={billing} onChange={(v) => setBilling(v as Billing)} options={BILLING_OPTIONS} />
          </FormField>
          <FormField label="สถานะ" htmlFor="sub-status">
            <Select id="sub-status" value={status} onChange={(v) => setStatus(v as SubStatus)} options={STATUS_OPTIONS} />
          </FormField>
          <FormField label={endLabel} htmlFor="sub-end" hint="เว้นว่าง = ไม่กำหนด">
            <Input id="sub-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </FormField>
        </div>
        <Button loading={saving} onClick={save}>
          บันทึกการเปลี่ยนแปลง
        </Button>
      </Section>

      {sub && (
        <div className="border-border flex flex-col gap-2.5 border-t pt-4">
          <p className="text-foreground flex items-center gap-1.5 text-[13px] font-medium">
            <CalendarPlus className="text-primary size-4" aria-hidden />
            เพิ่ม/ลดวันทันที ({status === "TRIALING" ? "ช่วงทดลอง" : "รอบบิล"}ปัจจุบัน)
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_DAYS.map((days) => (
              <Button
                key={days}
                size="sm"
                variant={days < 0 ? "outline" : "secondary"}
                loading={extending === days}
                disabled={extending !== undefined}
                onClick={() => extend(days)}
              >
                {days > 0 ? `+${days} วัน` : `${days} วัน`}
              </Button>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            ใช้สถานะที่บันทึกไว้ล่าสุด ({STATUS_LABEL[sub.status]}) · สิ้นสุด {formatDate(sub.status === "TRIALING" ? sub.trialEndsAt : sub.currentPeriodEnd)}
          </p>
        </div>
      )}
    </Card>
  );
}

function Shops({ user, onChanged }: { user: UserDetail; onChanged: () => void }) {
  const [target, setTarget] = useState<UserShop>();

  async function suspend(reason: string) {
    if (!target) return;
    try {
      await adminApi.suspendShop(target.id, reason);
      notify.success("ระงับสาขานี้แล้ว", "เจ้าของ พนักงาน และลูกค้าหน้าโต๊ะของสาขานี้ใช้งานไม่ได้");
      setTarget(undefined);
      onChanged();
    } catch (e) {
      notify.error(e);
    }
  }

  async function unsuspend(shop: UserShop) {
    try {
      await adminApi.unsuspendShop(shop.id);
      notify.success("ปลดระงับสาขาแล้ว");
      onChanged();
    } catch (e) {
      notify.error(e);
    }
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <Section
        title={`ร้านและสาขา (${user.shops.length}/${user.limits.branches})`}
        aside={<span className="text-muted-foreground text-xs">โต๊ะ {limitLabel(user.limits.tables, "")} · พนักงาน {limitLabel(user.limits.staff, "")}</span>}
      >
        <ul className="flex flex-col gap-3">
          {user.shops.map((shop) => (
            <li key={shop.id} className="border-border flex flex-col gap-3 rounded-lg border p-3.5">
              <div className="flex items-start gap-3">
                <span className="bg-primary-soft text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <Store className="size-[18px]" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-semibold">{shop.name}</p>
                  <p className="text-muted-foreground truncate text-xs">{shop.branch ? `สาขา${shop.branch}` : "สาขาหลัก"}</p>
                </div>
                {shop.suspended ? <SuspendedBadge /> : <Badge tone={shop.isOpen ? "success" : "neutral"}>{shop.isOpen ? "เปิดรับออเดอร์" : "ปิดร้าน"}</Badge>}
              </div>
              <p className="text-muted-foreground text-xs">
                {shop.tables} โต๊ะ · {shop.staff} พนักงาน · {shop.menuItems} เมนู · {shop.orders.toLocaleString("en-US")} ออเดอร์
              </p>
              {shop.suspended && <p className="bg-danger-soft text-danger-strong rounded-md px-3 py-2 text-xs">เหตุผล: {shop.suspendReason || "ไม่ได้ระบุ"}</p>}
              {shop.suspended ? (
                <Button size="sm" variant="secondary" onClick={() => unsuspend(shop)}>
                  ปลดระงับสาขานี้
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="text-danger-strong border-danger/30 hover:bg-danger-soft" onClick={() => setTarget(shop)}>
                  ระงับเฉพาะสาขานี้
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Section>
      <ReasonDialog
        open={target !== undefined}
        title="ระงับสาขานี้?"
        description={`${target?.name ?? ""} ${target?.branch ? `สาขา${target.branch}` : ""} จะใช้งานไม่ได้ทันที ลูกค้าสแกน QR สั่งอาหารไม่ได้ ส่วนสาขาอื่นของบัญชีเดียวกันยังใช้ได้ตามปกติ`}
        confirmLabel="ยืนยันระงับ"
        onClose={() => setTarget(undefined)}
        onConfirm={suspend}
      />
    </Card>
  );
}

function History({ user }: { user: UserDetail }) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <Section title="ประวัติการดำเนินการล่าสุด">
        {user.logs.length === 0 ? (
          <p className="text-muted-foreground text-sm">ยังไม่มีการดำเนินการจากผู้ดูแลระบบ</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {user.logs.map((log) => (
              <li key={log.id} className={cn("border-border relative border-l-2 pl-4 text-sm")}>
                <p className="text-foreground font-medium">{ACTION_LABEL[log.action] ?? log.action}</p>
                {log.detail && <p className="text-muted-foreground text-xs break-words">{log.detail}</p>}
                <p className="text-muted-foreground text-[11px]">
                  {formatDateTime(log.createdAt)} · {log.admin}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </Card>
  );
}
