"use client";

import Link from "next/link";
import {
  Ban,
  BanknoteArrowUp,
  CalendarClock,
  ChevronRight,
  ReceiptText,
  Store,
  Timer,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Badge, Card, Skeleton } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { useResource } from "@/hooks/use-resource";
import { cn } from "@/lib/cn";
import { adminApi, type Overview } from "../lib/admin-api";
import { baht, countdownLabel, daysLeft, formatDate, STATUS_LABEL } from "../lib/format";
import { PageTitle } from "./page-title";

const PLACEHOLDER: Overview = {
  totals: {
    owners: 0, banned: 0, shops: 0, suspendedShops: 0, trialing: 0, active: 0, pastDue: 0,
    canceled: 0, mrr: 0, ordersToday: 0, sales30d: 0, orders30d: 0,
  },
  signups: Array.from({ length: 14 }, (_, i) => ({ day: `2026-01-${String(i + 1).padStart(2, "0")}`, count: (i % 5) + 1 })),
  plans: [
    { plan: "a", name: "แพ็กเกจตัวอย่าง", count: 3 },
    { plan: "b", name: "แพ็กเกจตัวอย่าง", count: 2 },
  ],
  recent: Array.from({ length: 4 }, (_, i) => ({ id: String(i), email: "sample@example.com", name: "ชื่อตัวอย่าง", createdAt: "2026-01-01T00:00:00Z", banned: false })),
  expiring: Array.from({ length: 3 }, (_, i) => ({ userId: String(i), email: "sample@example.com", name: "ชื่อตัวอย่าง", status: "TRIALING", planName: "แพ็กเกจ", endsAt: "2026-01-01T00:00:00Z" })),
};

interface StatProps {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone: "primary" | "success" | "warning" | "danger";
}

const TONE: Record<StatProps["tone"], string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success-strong",
  warning: "bg-warning-soft text-warning-strong",
  danger: "bg-danger-soft text-danger-strong",
};

function Stat({ label, value, note, icon: Icon, tone }: StatProps) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-[13px]">{label}</p>
        <span className={cn("flex size-9 items-center justify-center rounded-lg", TONE[tone])}>
          <Icon className="size-[18px]" aria-hidden />
        </span>
      </div>
      <p className="font-display text-foreground text-[30px] leading-none font-semibold">{value}</p>
      <p className="text-muted-foreground text-[12px]">{note}</p>
    </Card>
  );
}

function Panel({ title, action, children, className }: { title: string; action?: { label: string; href: string }; children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("flex flex-col gap-5 p-[22px]", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-foreground text-base font-semibold">{title}</h2>
        {action && (
          <Link href={action.href} className="text-primary-strong rounded text-xs font-medium whitespace-nowrap hover:underline">
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </Card>
  );
}

function SignupsChart({ signups }: { signups: Overview["signups"] }) {
  const max = Math.max(1, ...signups.map((s) => s.count));
  const total = signups.reduce((sum, s) => sum + s.count, 0);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-[13px]">
        รวม <span className="text-foreground font-semibold">{total}</span> บัญชีใน 14 วันที่ผ่านมา
      </p>
      <ul className="flex h-40 items-end gap-1.5 sm:gap-2" aria-label="จำนวนสมัครใหม่รายวัน">
        {signups.map(({ day, count }) => (
          <li key={day} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5" title={`${day}: ${count} บัญชี`}>
            <span className="text-muted-foreground text-[11px] opacity-0 transition-opacity group-hover:opacity-100">{count}</span>
            <span
              className={cn("w-full rounded-t-md transition-colors", count > 0 ? "bg-primary group-hover:bg-primary-strong" : "bg-border")}
              style={{ height: `${Math.max(count === 0 ? 3 : 8, (count / max) * 100)}%` }}
            />
            <span className="text-muted-foreground text-[10px]">{day.slice(8)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusBar({ totals }: { totals: Overview["totals"] }) {
  const parts = [
    { label: "ใช้งานอยู่", value: totals.active, color: "bg-success" },
    { label: "ทดลองใช้", value: totals.trialing, color: "bg-primary" },
    { label: "ค้างชำระ", value: totals.pastDue, color: "bg-warning" },
    { label: "ยกเลิก/หมดอายุ", value: totals.canceled, color: "bg-slate-300" },
  ];
  const sum = parts.reduce((s, p) => s + p.value, 0);
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-muted flex h-3 w-full overflow-hidden rounded-full" role="img" aria-label="สัดส่วนสถานะการสมัครแพ็กเกจ">
        {sum > 0 && parts.map((p) => <span key={p.label} className={p.color} style={{ width: `${(p.value / sum) * 100}%` }} />)}
      </div>
      <ul className="grid grid-cols-2 gap-3">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2 text-[13px]">
            <span aria-hidden className={cn("size-2.5 rounded-full", p.color)} />
            <span className="text-muted-foreground flex-1">{p.label}</span>
            <span className="text-foreground font-semibold">{p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlanSplit({ plans }: { plans: Overview["plans"] }) {
  const max = Math.max(1, ...plans.map((p) => p.count));
  if (plans.length === 0) return <p className="text-muted-foreground text-sm">ยังไม่มีผู้สมัครแพ็กเกจ</p>;
  return (
    <ul className="flex flex-col gap-3.5">
      {plans.map((p) => (
        <li key={p.plan} className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[13px]">
            <span className="text-foreground font-medium">{p.name}</span>
            <span className="text-muted-foreground">{p.count} ราย</span>
          </div>
          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div className="bg-primary h-full rounded-full" style={{ width: `${(p.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function UserLink({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <Link
      href={`${ROUTES.adminUsers}?user=${id}`}
      className="hover:bg-muted focus-visible:ring-primary/50 -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      {children}
      <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
    </Link>
  );
}

export function OverviewPage() {
  const { data, error, loading, reload } = useResource((signal) => adminApi.overview(signal));
  const view = data ?? PLACEHOLDER;
  const { totals } = view;

  const content = (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Stat label="เจ้าของร้านทั้งหมด" value={totals.owners.toLocaleString("en-US")} note={`ถูกแบน ${totals.banned} บัญชี`} icon={Users} tone="primary" />
        <Stat label="ร้าน/สาขาทั้งหมด" value={totals.shops.toLocaleString("en-US")} note={`ถูกระงับ ${totals.suspendedShops} ร้าน`} icon={Store} tone="primary" />
        <Stat label="รายได้ต่อเดือน (ประมาณ)" value={baht(totals.mrr)} note="จากแพ็กเกจที่ชำระแล้ว รายปีเฉลี่ยเป็นรายเดือน" icon={BanknoteArrowUp} tone="success" />
        <Stat label="กำลังทดลองใช้" value={totals.trialing.toLocaleString("en-US")} note={`ค้างชำระ ${totals.pastDue} ราย`} icon={Timer} tone="warning" />
        <Stat label="ออเดอร์วันนี้ (ทุกร้าน)" value={totals.ordersToday.toLocaleString("en-US")} note={`30 วันล่าสุด ${totals.orders30d.toLocaleString("en-US")} ออเดอร์ที่ชำระแล้ว`} icon={ReceiptText} tone="primary" />
        <Stat label="ยอดขายของร้านทั้งหมด 30 วัน" value={baht(totals.sales30d)} note="เฉพาะออเดอร์ที่ชำระแล้ว" icon={BanknoteArrowUp} tone="success" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="สมัครใหม่ 14 วันล่าสุด" className="xl:col-span-2">
          <SignupsChart signups={view.signups} />
        </Panel>
        <Panel title="สถานะการสมัครแพ็กเกจ">
          <StatusBar totals={totals} />
          <div className="border-border border-t pt-5">
            <p className="text-muted-foreground mb-3 text-xs">แยกตามแพ็กเกจ</p>
            <PlanSplit plans={view.plans} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="ใกล้หมดอายุภายใน 7 วัน" action={{ label: "ดูผู้ใช้ทั้งหมด →", href: ROUTES.adminUsers }}>
          {view.expiring.length === 0 ? (
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <CalendarClock className="size-4" aria-hidden />
              ไม่มีบัญชีที่ใกล้หมดอายุ
            </p>
          ) : (
            <ul className="divide-border divide-y">
              {view.expiring.map((row) => {
                const days = daysLeft(row.endsAt);
                return (
                  <li key={row.userId}>
                    <UserLink id={row.userId}>
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground truncate text-sm font-semibold">{row.name || row.email}</p>
                        <p className="text-muted-foreground truncate text-xs">
                          {row.planName} · {STATUS_LABEL[row.status]} · {formatDate(row.endsAt)}
                        </p>
                      </div>
                      <Badge tone={days !== null && days < 0 ? "danger" : "warning"}>{countdownLabel(row.endsAt)}</Badge>
                    </UserLink>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="สมัครล่าสุด" action={{ label: "จัดการผู้ใช้ →", href: ROUTES.adminUsers }}>
          <ul className="divide-border divide-y">
            {view.recent.map((u) => (
              <li key={u.id}>
                <UserLink id={u.id}>
                  <span aria-hidden className="bg-primary-soft text-primary-strong flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                    {(u.name || u.email).slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm font-semibold">{u.name || u.email}</p>
                    <p className="text-muted-foreground truncate text-xs">{u.email}</p>
                  </div>
                  {u.banned ? (
                    <Badge tone="danger">
                      <Ban className="size-3.5" aria-hidden />
                      ถูกแบน
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">{formatDate(u.createdAt)}</span>
                  )}
                </UserLink>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );

  return (
    <>
      <PageTitle title="ภาพรวมระบบ" description="สถานะผู้ใช้ ร้านค้า และรายได้ของ SHARKZEN ORDER ทั้งหมดในที่เดียว" />
      {error ? (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-foreground font-semibold">โหลดข้อมูลไม่สำเร็จ</p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <button type="button" onClick={reload} className="text-primary-strong cursor-pointer text-sm font-semibold hover:underline">
            ลองใหม่
          </button>
        </Card>
      ) : loading ? (
        <Skeleton>{content}</Skeleton>
      ) : (
        content
      )}
    </>
  );
}
