"use client";

import { useState } from "react";
import { History, Mail, MessageCircle, Phone, Timer, type LucideIcon } from "lucide-react";
import { Badge, Button, Card, EmptyState, FormField, Input, Pagination, Skeleton } from "@/components/ui";
import { useResource } from "@/hooks/use-resource";
import { notify } from "@/lib/toast";
import { adminApi, type AdminLog, type Paged, type SystemSettings } from "../lib/admin-api";
import { ACTION_LABEL, formatDateTime } from "../lib/format";
import { PageTitle } from "./page-title";

const logTone = (action: string) =>
  action === "user.ban" || action === "shop.suspend" || action === "plan.delete"
    ? ("danger" as const)
    : action.endsWith("unban") || action.endsWith("unsuspend") || action === "plan.create"
      ? ("success" as const)
      : ("info" as const);

const DEFAULTS: SystemSettings = { trialDays: 0, yearlyFreeMonths: 0, supportEmail: "", supportPhone: "", supportLine: "" };

export function SettingsPage() {
  return (
    <>
      <PageTitle title="ตั้งค่าและบันทึก" description="กำหนดจำนวนวันทดลองใช้ ช่องทางติดต่อที่ผู้ถูกระงับจะเห็น และตรวจประวัติการทำงานของผู้ดูแลระบบ" />
      <SettingsCard />
      <LogsCard />
    </>
  );
}

function SettingsCard() {
  const { data, error, reload } = useResource((signal) => adminApi.settings(signal));

  if (error) {
    return (
      <Card className="flex flex-col items-start gap-3">
        <p className="text-foreground text-sm font-semibold">โหลดการตั้งค่าไม่สำเร็จ</p>
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={reload}>
          ลองใหม่
        </Button>
      </Card>
    );
  }
  if (!data) {
    return (
      <Skeleton>
        <SettingsForm initial={DEFAULTS} onSaved={() => undefined} />
      </Skeleton>
    );
  }
  return <SettingsForm initial={data} onSaved={reload} />;
}

function SectionCard({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="flex h-full flex-col gap-5 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="bg-primary-soft text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Icon className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-foreground text-base font-semibold">{title}</h2>
          <p className="text-muted-foreground text-[13px]">{description}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

function SettingsForm({ initial, onSaved }: { initial: SystemSettings; onSaved: () => void }) {
  const [form, setForm] = useState({
    trialDays: String(initial.trialDays),
    yearlyFreeMonths: String(initial.yearlyFreeMonths),
    supportEmail: initial.supportEmail,
    supportPhone: initial.supportPhone,
    supportLine: initial.supportLine,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const dirty =
    form.trialDays !== String(initial.trialDays) ||
    form.yearlyFreeMonths !== String(initial.yearlyFreeMonths) ||
    form.supportEmail !== initial.supportEmail ||
    form.supportPhone !== initial.supportPhone ||
    form.supportLine !== initial.supportLine;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const days = Number(form.trialDays);
    if (form.trialDays.trim() === "" || !Number.isInteger(days) || days < 0 || days > 365) {
      return setError("วันทดลองใช้ต้องเป็นจำนวนเต็ม 0-365");
    }
    const free = Number(form.yearlyFreeMonths);
    if (form.yearlyFreeMonths.trim() === "" || !Number.isInteger(free) || free < 0 || free > 11) {
      return setError("เดือนที่แถมรายปีต้องเป็นจำนวนเต็ม 0-11");
    }
    setError(undefined);
    setSaving(true);
    try {
      await adminApi.saveSettings({
        trialDays: days,
        yearlyFreeMonths: free,
        supportEmail: form.supportEmail.trim(),
        supportPhone: form.supportPhone.trim(),
        supportLine: form.supportLine.trim(),
      });
      notify.success("บันทึกการตั้งค่าแล้ว");
      onSaved();
    } catch (err) {
      notify.error(err);
    } finally {
      setSaving(false);
    }
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const withIcon = (Icon: LucideIcon) => (
    <Icon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
  );

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="grid items-stretch gap-5 lg:grid-cols-2">
        <SectionCard icon={Timer} title="ช่วงทดลองและราคารายปี" description="ใช้กับผู้สมัครใหม่ ปรับรายคนได้ที่หน้าผู้ใช้งาน">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="ทดลองใช้ฟรี (วัน)" htmlFor="set-trial" hint="ไม่กระทบคนที่กำลังทดลองอยู่">
              <Input id="set-trial" type="number" min={0} max={365} inputMode="numeric" value={form.trialDays} onChange={set("trialDays")} />
            </FormField>
            <FormField label="รายปีแถมฟรี (เดือน)" htmlFor="set-free" hint="เช่น 2 = จ่ายแค่ 10 เดือน ใช้ครบ 12 เดือน">
              <Input id="set-free" type="number" min={0} max={11} inputMode="numeric" value={form.yearlyFreeMonths} onChange={set("yearlyFreeMonths")} />
            </FormField>
          </div>
          <p className="bg-primary-soft text-primary-strong rounded-lg px-3.5 py-2.5 text-xs">
            ตัวอย่างที่ลูกค้าเห็น: ทดลองฟรี {form.trialDays || 0} วัน · รายปีจ่ายแค่ {12 - (Number(form.yearlyFreeMonths) || 0)} เดือน
          </p>
        </SectionCard>

        <SectionCard icon={Mail} title="ช่องทางติดต่อผู้ดูแลระบบ" description="แสดงในหน้าต่างเมื่อบัญชีหรือร้านถูกแบน/ระงับ ปล่อยว่างช่องที่ไม่ใช้">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="อีเมล" htmlFor="set-email" className="sm:col-span-2">
              <div className="relative">
                {withIcon(Mail)}
                <Input id="set-email" type="email" className="pl-9" value={form.supportEmail} onChange={set("supportEmail")} placeholder="support@..." />
              </div>
            </FormField>
            <FormField label="โทรศัพท์" htmlFor="set-phone">
              <div className="relative">
                {withIcon(Phone)}
                <Input id="set-phone" type="tel" className="pl-9" value={form.supportPhone} onChange={set("supportPhone")} placeholder="0X-XXX-XXXX" />
              </div>
            </FormField>
            <FormField label="LINE" htmlFor="set-line">
              <div className="relative">
                {withIcon(MessageCircle)}
                <Input id="set-line" className="pl-9" value={form.supportLine} onChange={set("supportLine")} placeholder="@ไอดีไลน์" />
              </div>
            </FormField>
          </div>
        </SectionCard>
      </div>

      {error && (
        <p role="alert" className="bg-danger-soft text-danger-strong rounded-lg px-4 py-3 text-sm">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <p className="text-muted-foreground mr-auto text-xs">{dirty ? "มีการเปลี่ยนแปลงที่ยังไม่บันทึก" : "ข้อมูลเป็นปัจจุบัน"}</p>
        <Button type="submit" loading={saving} disabled={!dirty}>
          บันทึกการตั้งค่า
        </Button>
      </div>
    </form>
  );
}

const PLACEHOLDER_LOGS: Paged<AdminLog> = {
  total: 4,
  page: 1,
  pageSize: 20,
  items: Array.from({ length: 4 }, (_, i) => ({
    id: String(i),
    admin: "admin@example.com",
    action: "user.ban",
    targetType: "user",
    targetId: "x",
    target: "sample@example.com",
    detail: "รายละเอียดตัวอย่าง",
    createdAt: "2026-01-01T00:00:00Z",
  })),
};

function LogsCard() {
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useResource((signal) => adminApi.logs(page, signal), { key: String(page) });
  const view = data ?? PLACEHOLDER_LOGS;

  const list = (
    <ul className="divide-border divide-y">
      {view.items.map((log) => (
        <li key={log.id} className="grid gap-x-4 gap-y-1.5 px-4 py-3.5 sm:px-5 md:grid-cols-[170px_minmax(0,1fr)_190px] md:items-center">
          <span>
            <Badge tone={logTone(log.action)}>{ACTION_LABEL[log.action] ?? log.action}</Badge>
          </span>
          <div className="min-w-0">
            <p className="text-foreground truncate text-sm font-medium">{log.target}</p>
            {log.detail && <p className="text-muted-foreground text-xs break-words">{log.detail}</p>}
          </div>
          <p className="text-muted-foreground text-xs md:text-right">
            {formatDateTime(log.createdAt)} · <span className="break-all">{log.admin}</span>
          </p>
        </li>
      ))}
    </ul>
  );

  return (
    <Card className="flex flex-col gap-0 overflow-hidden p-0">
      <div className="border-border flex items-center gap-2 border-b px-5 py-4">
        <History className="text-primary size-[18px]" aria-hidden />
        <h2 className="text-foreground text-base font-semibold">บันทึกการทำงานของผู้ดูแลระบบ</h2>
      </div>
      {error ? (
        <EmptyState icon={<History className="size-6" aria-hidden />} title="โหลดบันทึกไม่สำเร็จ" description={error} actionLabel="ลองใหม่" onAction={reload} />
      ) : loading ? (
        <Skeleton>{list}</Skeleton>
      ) : view.items.length === 0 ? (
        <EmptyState icon={<History className="size-6" aria-hidden />} title="ยังไม่มีบันทึก" description="เมื่อมีการแบน ระงับ หรือแก้ไขแพ็กเกจ จะแสดงที่นี่" />
      ) : (
        list
      )}
      {view.items.length > 0 && !loading && (
        <Pagination
          page={view.page}
          pageCount={Math.max(1, Math.ceil(view.total / view.pageSize))}
          from={(view.page - 1) * view.pageSize + 1}
          to={(view.page - 1) * view.pageSize + view.items.length}
          total={view.total}
          onChange={setPage}
        />
      )}
    </Card>
  );
}
