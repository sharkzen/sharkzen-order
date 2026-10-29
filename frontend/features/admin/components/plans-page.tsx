"use client";

import { useState } from "react";
import { Check, Gem, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Badge, Button, Card, ConfirmDialog, Dialog, FormField, Input, Skeleton, Switch, Textarea } from "@/components/ui";
import { useResource } from "@/hooks/use-resource";
import { notify } from "@/lib/toast";
import { adminApi, type AdminPlan, type PlanBody } from "../lib/admin-api";
import { baht, limitLabel } from "../lib/format";
import { PageTitle } from "./page-title";

const PLACEHOLDER: AdminPlan[] = Array.from({ length: 3 }, (_, i) => ({
  id: `p${i}`,
  name: "ชื่อแพ็กเกจ",
  description: "คำอธิบายแพ็กเกจตัวอย่าง",
  monthly: 799,
  yearly: 7990,
  tablesLimit: null,
  staffLimit: 10,
  branchesLimit: 1,
  active: true,
  sortOrder: i,
  cta: "",
  perks: ["จุดเด่นตัวอย่าง", "จุดเด่นตัวอย่าง"],
  featured: false,
  subscribers: 0,
}));

export function PlansPage() {
  const { data, error, loading, reload } = useResource((signal) => adminApi.plans(signal));
  const [editing, setEditing] = useState<AdminPlan | "new">();
  const [deleting, setDeleting] = useState<AdminPlan>();

  async function toggleActive(plan: AdminPlan, active: boolean) {
    try {
      await adminApi.updatePlan(plan.id, {
        name: plan.name,
        description: plan.description,
        monthly: plan.monthly,
        yearly: plan.yearly,
        tablesLimit: plan.tablesLimit,
        staffLimit: plan.staffLimit,
        branchesLimit: plan.branchesLimit,
        sortOrder: plan.sortOrder,
        cta: plan.cta,
        perks: plan.perks,
        featured: plan.featured,
        active,
      });
      notify.success(active ? "เปิดขายแพ็กเกจแล้ว" : "ปิดขายแพ็กเกจแล้ว", active ? undefined : "ผู้ใช้ใหม่เลือกไม่ได้ ส่วนคนที่ใช้อยู่ยังใช้ต่อได้");
      reload();
    } catch (e) {
      notify.error(e);
    }
  }

  async function remove() {
    if (!deleting) return;
    try {
      await adminApi.deletePlan(deleting.id);
      notify.success("ลบแพ็กเกจแล้ว");
      setDeleting(undefined);
      reload();
    } catch (e) {
      notify.error(e);
      setDeleting(undefined);
    }
  }

  const plans = data ?? PLACEHOLDER;
  const grid = (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {plans.map((plan) => {
        const savings = plan.monthly * 12 - plan.yearly;
        return (
          <Card
            key={plan.id}
            className={`flex h-full flex-col gap-0 overflow-hidden p-0 transition-shadow hover:shadow-card ${plan.featured ? "border-primary border-2" : ""}`}
          >
            <div className={`flex flex-1 flex-col gap-5 p-5 sm:p-6 ${plan.active ? "" : "opacity-60"}`}>
              <div className="flex items-start gap-3">
                <span className="bg-primary-soft text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
                  <Gem className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-foreground truncate text-xl leading-tight font-semibold">{plan.name}</h2>
                  <p className="text-muted-foreground truncate text-xs">รหัส {plan.id}</p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                  {plan.featured && <Badge tone="info">แนะนำ</Badge>}
                  <Badge tone={plan.active ? "success" : "neutral"}>{plan.active ? "เปิดขาย" : "ปิดขาย"}</Badge>
                </div>
              </div>

              <p className="text-muted-foreground line-clamp-2 min-h-[2.6em] text-[13px] leading-snug">{plan.description || "ไม่มีคำอธิบาย"}</p>

              <div className="bg-muted flex flex-wrap items-end justify-between gap-x-4 gap-y-2 rounded-xl px-4 py-3.5">
                <div>
                  <p className="text-muted-foreground text-xs">รายเดือน</p>
                  <p className="font-display text-foreground text-[26px] leading-tight font-semibold">{baht(plan.monthly)}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">รายปี</p>
                  <p className="font-display text-foreground text-[26px] leading-tight font-semibold">{baht(plan.yearly)}</p>
                </div>
                {savings > 0 && (
                  <p className="text-success-strong w-full text-xs font-medium">รายปีประหยัดกว่า {baht(savings)} ต่อปี</p>
                )}
              </div>

              <ul className="flex flex-1 flex-col gap-2.5 text-[13px]">
                {plan.perks.length === 0 && <li className="text-muted-foreground">ยังไม่ได้ใส่จุดเด่น</li>}
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5">
                    <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
                    <span className="text-foreground min-w-0">{perk}</span>
                  </li>
                ))}
              </ul>

              <dl className="border-border grid grid-cols-3 divide-x rounded-xl border text-center">
                {[
                  ["สาขา", limitLabel(plan.branchesLimit, "")],
                  ["โต๊ะ/สาขา", limitLabel(plan.tablesLimit, "")],
                  ["พนักงาน", limitLabel(plan.staffLimit, "")],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-0.5 px-2 py-2.5">
                    <dd className="text-foreground text-sm font-semibold">{value}</dd>
                    <dt className="text-muted-foreground text-[11px]">{label}</dt>
                  </div>
                ))}
              </dl>
            </div>

            <div className="border-border bg-surface flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t px-5 py-3.5 sm:px-6">
              <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
                <Switch checked={plan.active} onCheckedChange={(v) => toggleActive(plan, v)} aria-label={`เปิดขาย ${plan.name}`} />
                <span className="text-muted-foreground">เปิดขาย</span>
              </label>
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Users className="size-3.5" aria-hidden />
                {plan.subscribers} ผู้ใช้
              </p>
              <div className="ml-auto flex items-center gap-1.5">
                <Button size="sm" variant="outline" onClick={() => setEditing(plan)} aria-label={`แก้ไข ${plan.name}`}>
                  <Pencil className="size-4" aria-hidden />
                  แก้ไข
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger-strong hover:bg-danger-soft px-2.5"
                  aria-label={`ลบ ${plan.name}`}
                  onClick={() => setDeleting(plan)}
                  disabled={plan.subscribers > 0}
                  title={plan.subscribers > 0 ? "มีผู้ใช้อยู่ ลบไม่ได้ ปิดขายแทน" : undefined}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  return (
    <>
      <PageTitle
        title="แพ็กเกจและราคา"
        description="กำหนดราคา เพดานสาขา/โต๊ะ/พนักงาน และเปิด-ปิดขายแพ็กเกจ มีผลกับผู้ใช้ทันที"
        action={
          <Button onClick={() => setEditing("new")}>
            <Plus className="size-4" aria-hidden />
            เพิ่มแพ็กเกจ
          </Button>
        }
      />

      <p className="bg-primary-soft text-primary-strong rounded-lg px-4 py-3 text-[13px]">
        เปลี่ยนราคาแล้ว ผู้ใช้ที่สมัครตัดบัตรไว้แล้วยังถูกคิดราคาเดิมจนกว่าจะเปลี่ยนแพ็กเกจ ส่วนผู้ที่สมัครหรือต่ออายุใหม่จะใช้ราคาใหม่ ลดเพดานแล้วผู้ใช้ที่เกินเพดานจะเพิ่มโต๊ะ/พนักงานไม่ได้จนกว่าจะลดลง
      </p>

      {error ? (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-foreground font-semibold">โหลดแพ็กเกจไม่สำเร็จ</p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={reload}>
            ลองใหม่
          </Button>
        </Card>
      ) : loading ? (
        <Skeleton>{grid}</Skeleton>
      ) : (
        grid
      )}

      <PlanDialog
        plan={editing}
        onClose={() => setEditing(undefined)}
        onSaved={() => {
          setEditing(undefined);
          reload();
        }}
      />

      <ConfirmDialog
        open={deleting !== undefined}
        title="ลบแพ็กเกจนี้?"
        description={`ลบ “${deleting?.name ?? ""}” ถาวร (ไม่มีผู้ใช้แพ็กเกจนี้อยู่) หากเพียงต้องการหยุดขายให้ปิดขายแทน`}
        confirmLabel="ลบแพ็กเกจ"
        tone="danger"
        onConfirm={remove}
        onCancel={() => setDeleting(undefined)}
      />
    </>
  );
}

interface FormState {
  id: string;
  name: string;
  description: string;
  monthly: string;
  yearly: string;
  tablesLimit: string;
  staffLimit: string;
  branchesLimit: string;
  sortOrder: string;
  cta: string;
  perks: string;
  featured: boolean;
  active: boolean;
}

const EMPTY: FormState = {
  id: "",
  name: "",
  description: "",
  monthly: "",
  yearly: "",
  tablesLimit: "",
  staffLimit: "",
  branchesLimit: "1",
  sortOrder: "0",
  cta: "",
  perks: "",
  featured: false,
  active: true,
};

const toForm = (plan: AdminPlan): FormState => ({
  id: plan.id,
  name: plan.name,
  description: plan.description,
  monthly: String(plan.monthly),
  yearly: String(plan.yearly),
  tablesLimit: plan.tablesLimit === null ? "" : String(plan.tablesLimit),
  staffLimit: plan.staffLimit === null ? "" : String(plan.staffLimit),
  branchesLimit: String(plan.branchesLimit),
  sortOrder: String(plan.sortOrder),
  cta: plan.cta,
  perks: plan.perks.join("\n"),
  featured: plan.featured,
  active: plan.active,
});

function PlanDialog({ plan, onClose, onSaved }: { plan?: AdminPlan | "new"; onClose: () => void; onSaved: () => void }) {
  const open = plan !== undefined;
  // เปลี่ยนแพ็กเกจที่แก้ = ฟอร์มใหม่ (key) เพื่อไม่ให้ค่าของอันก่อนค้าง
  return (
    <Dialog open={open} title={plan === "new" ? "เพิ่มแพ็กเกจ" : "แก้ไขแพ็กเกจ"} onClose={onClose} className="w-[min(94vw,560px)]">
      {open && <PlanForm key={plan === "new" ? "new" : plan.id} plan={plan} onClose={onClose} onSaved={onSaved} />}
    </Dialog>
  );
}

function PlanForm({ plan, onClose, onSaved }: { plan: AdminPlan | "new"; onClose: () => void; onSaved: () => void }) {
  const isNew = plan === "new";
  const [form, setForm] = useState<FormState>(isNew ? EMPTY : toForm(plan));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const num = (value: string) => (value.trim() === "" ? null : Number(value));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const monthly = num(form.monthly);
    const yearly = num(form.yearly);
    if (!form.name.trim()) return setError("กรอกชื่อแพ็กเกจ");
    if (monthly === null || yearly === null || !Number.isInteger(monthly) || !Number.isInteger(yearly) || monthly < 0 || yearly < 0) {
      return setError("ราคาต้องเป็นจำนวนเต็มบาท ตั้งแต่ 0 ขึ้นไป");
    }
    const branches = num(form.branchesLimit);
    if (branches === null || !Number.isInteger(branches) || branches < 1) return setError("จำนวนสาขาต้องเป็นจำนวนเต็มตั้งแต่ 1");

    const body: PlanBody = {
      name: form.name.trim(),
      description: form.description.trim(),
      monthly,
      yearly,
      tablesLimit: num(form.tablesLimit),
      staffLimit: num(form.staffLimit),
      branchesLimit: branches,
      active: form.active,
      sortOrder: num(form.sortOrder) ?? 0,
      cta: form.cta.trim(),
      perks: form.perks.split("\n").map((line) => line.trim()).filter(Boolean),
      featured: form.featured,
    };
    setError(undefined);
    setSaving(true);
    try {
      if (isNew) await adminApi.createPlan({ ...body, id: form.id.trim() });
      else await adminApi.updatePlan(plan.id, body);
      notify.success(isNew ? "เพิ่มแพ็กเกจแล้ว" : "บันทึกแพ็กเกจแล้ว");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  const monthlyNum = Number(form.monthly);
  const hint = monthlyNum > 0 ? `ราคาปกติรายปีตามสูตร จ่าย 10 เดือน = ${(monthlyNum * 10).toLocaleString("en-US")} บาท` : undefined;

  return (
    <form onSubmit={submit}>
      <div className="flex flex-col gap-5 p-6">
        <p aria-hidden className="font-display text-lg font-semibold">
          {isNew ? "เพิ่มแพ็กเกจ" : "แก้ไขแพ็กเกจ"}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="ชื่อแพ็กเกจ" htmlFor="plan-name" required>
            <Input id="plan-name" value={form.name} maxLength={40} onChange={(e) => set("name", e.target.value)} placeholder="เช่น โปร" />
          </FormField>
          <FormField label="รหัสแพ็กเกจ" htmlFor="plan-id" required={isNew} hint={isNew ? "a-z 0-9 และ - ตั้งแล้วแก้ไม่ได้" : "แก้ไม่ได้"}>
            <Input id="plan-id" value={form.id} disabled={!isNew} onChange={(e) => set("id", e.target.value.toLowerCase())} placeholder="เช่น pro" />
          </FormField>
        </div>

        <FormField label="คำอธิบายสั้น" htmlFor="plan-desc">
          <Textarea id="plan-desc" rows={2} maxLength={120} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="ราคารายเดือน (บาท)" htmlFor="plan-monthly" required>
            <Input id="plan-monthly" type="number" min={0} inputMode="numeric" value={form.monthly} onChange={(e) => set("monthly", e.target.value)} />
          </FormField>
          <FormField label="ราคารายปี (บาท)" htmlFor="plan-yearly" required hint={hint}>
            <Input id="plan-yearly" type="number" min={0} inputMode="numeric" value={form.yearly} onChange={(e) => set("yearly", e.target.value)} />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="สาขาสูงสุด" htmlFor="plan-branches" required>
            <Input id="plan-branches" type="number" min={1} value={form.branchesLimit} onChange={(e) => set("branchesLimit", e.target.value)} />
          </FormField>
          <FormField label="โต๊ะต่อสาขา" htmlFor="plan-tables" hint="ว่าง = ไม่จำกัด">
            <Input id="plan-tables" type="number" min={1} value={form.tablesLimit} placeholder="ไม่จำกัด" onChange={(e) => set("tablesLimit", e.target.value)} />
          </FormField>
          <FormField label="พนักงานต่อสาขา" htmlFor="plan-staff" hint="ว่าง = ไม่จำกัด">
            <Input id="plan-staff" type="number" min={1} value={form.staffLimit} placeholder="ไม่จำกัด" onChange={(e) => set("staffLimit", e.target.value)} />
          </FormField>
        </div>

        <FormField label="จุดเด่นของแพ็กเกจ" htmlFor="plan-perks" hint="พิมพ์บรรทัดละ 1 ข้อ (สูงสุด 12 ข้อ) แสดงเป็นรายการบนการ์ดราคา">
          <Textarea id="plan-perks" rows={5} value={form.perks} onChange={(e) => set("perks", e.target.value)} placeholder={"1 สาขา สูงสุด 15 โต๊ะ\nเมนูอาหารไม่จำกัด"} />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="ข้อความปุ่ม" htmlFor="plan-cta">
            <Input id="plan-cta" maxLength={40} value={form.cta} onChange={(e) => set("cta", e.target.value)} placeholder="เช่น เริ่มทดลองฟรี" />
          </FormField>
          <label className="border-border flex h-10 cursor-pointer items-center justify-between gap-3 self-end rounded-lg border px-3 text-sm">
            แพ็กเกจแนะนำ
            <Switch checked={form.featured} onCheckedChange={(v) => set("featured", v)} aria-label="แพ็กเกจแนะนำ" />
          </label>
        </div>

        <div className="grid items-end gap-4 sm:grid-cols-2">
          <FormField label="ลำดับแสดง" htmlFor="plan-sort" hint="น้อยขึ้นก่อน">
            <Input id="plan-sort" type="number" min={0} value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
          </FormField>
          <label className="border-border flex h-10 cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 text-sm">
            เปิดขายแพ็กเกจนี้
            <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} aria-label="เปิดขายแพ็กเกจนี้" />
          </label>
        </div>

        {error && (
          <p role="alert" className="bg-danger-soft text-danger-strong rounded-lg px-3 py-2.5 text-sm">
            {error}
          </p>
        )}
      </div>

      <div className="border-border flex justify-end gap-3 border-t px-6 py-4">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          ยกเลิก
        </Button>
        <Button type="submit" loading={saving}>
          {isNew ? "เพิ่มแพ็กเกจ" : "บันทึก"}
        </Button>
      </div>
    </form>
  );
}
