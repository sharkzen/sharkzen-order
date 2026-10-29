"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, ChevronsUpDown, Plus, Store } from "lucide-react";
import { Button, Dialog, FormField, Input, Spinner } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/cn";
import { notify } from "@/lib/toast";
import { useShop } from "@/features/shop/components/shop-provider";
import { shopApi, type Branch, type BranchList } from "@/features/shop/lib/shop-api";

const branchLabel = (branch: Branch) => branch.branch || "สาขาหลัก";

/**
 * ปุ่มเลือกสาขา: แสดงสาขาปัจจุบัน กดเพื่อสลับสาขาหรือเพิ่มสาขาใหม่ (จำนวนตามแพ็กเกจ)
 * สลับแล้วโหลดหน้าใหม่ เพื่อให้ข้อมูลและการอัปเดตสดทั้งหมดเป็นของสาขาที่เลือก
 */
export function ShopSwitcher() {
  const { shop } = useShop();
  const [open, setOpen] = useState(false);
  const [branches, setBranches] = useState<BranchList>();
  const [switching, setSwitching] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    shopApi.branches().then(({ data }) => setBranches(data), (e) => notify.error(e));
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function choose(branch: Branch) {
    if (branch.active) return setOpen(false);
    setSwitching(branch.id);
    try {
      await shopApi.switchBranch(branch.id);
      window.location.reload();
    } catch (e) {
      notify.error(e);
      setSwitching(null);
    }
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="bg-background hover:bg-primary-soft focus-visible:ring-primary/50 flex w-full cursor-pointer flex-col gap-0.5 rounded-lg p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <span className="text-muted-foreground text-[11px]">พื้นที่จัดการร้าน</span>
        <span className="flex items-center justify-between gap-2">
          <span className="text-foreground text-sm font-semibold">{shop?.name ?? " "}</span>
          <ChevronsUpDown className="text-muted-foreground size-[15px] shrink-0" aria-hidden />
        </span>
        <span className="text-muted-foreground text-[11px]">{shop?.branch || "สาขาหลัก"}</span>
      </button>

      {open && (
        <div className="border-border bg-surface shadow-float absolute inset-x-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-xl border">
          <p className="text-muted-foreground flex items-center justify-between px-3.5 pt-3 pb-1.5 text-[11px]">
            สาขาของคุณ
            {branches && (
              <span className="tabular-nums">
                {branches.items.length} / {branches.limit} สาขา
              </span>
            )}
          </p>
          {branches ? (
            <ul role="listbox" aria-label="เลือกสาขา" className="scroll-thin max-h-60 overflow-y-auto px-1.5 pb-1.5">
              {branches.items.map((branch) => (
                <li key={branch.id} role="option" aria-selected={branch.active}>
                  <button
                    type="button"
                    disabled={switching !== null}
                    onClick={() => void choose(branch)}
                    className={cn(
                      "hover:bg-muted focus-visible:bg-muted flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors focus-visible:outline-none disabled:cursor-wait",
                      branch.active && "bg-primary-soft hover:bg-primary-soft",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg",
                        branch.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Store className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-foreground block truncate text-[13px] font-semibold">{branchLabel(branch)}</span>
                      <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                        <span
                          aria-hidden
                          className={cn("size-1.5 rounded-full", branch.isOpen ? "bg-success" : "bg-muted-foreground/50")}
                        />
                        {branch.isOpen ? "เปิดรับออเดอร์" : "ปิดรับออเดอร์"}
                      </span>
                    </span>
                    {switching === branch.id ? (
                      <Spinner className="size-4" />
                    ) : (
                      branch.active && <Check className="text-primary-strong size-4 shrink-0" aria-hidden />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex justify-center py-6">
              <Spinner className="size-5" />
            </div>
          )}
          <div className="border-border border-t p-1.5">
            {branches && branches.items.length >= branches.limit ? (
              <Link
                href={ROUTES.plan}
                onClick={() => setOpen(false)}
                className="hover:bg-primary-soft focus-visible:bg-primary-soft flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors focus-visible:outline-none"
              >
                <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
                  <Plus className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-foreground block text-[13px] font-semibold">เพิ่มสาขาไม่ได้</span>
                  <span className="text-muted-foreground block text-[11px] leading-snug">
                    แพ็กเกจ{branches.planName}มีได้ {branches.limit} สาขา
                    {branches.limit === 1 ? " อัปเกรดเป็นหลายสาขา" : ""}
                  </span>
                </span>
                <ArrowUpRight className="text-primary-strong size-4 shrink-0" aria-hidden />
              </Link>
            ) : (
              <button
                type="button"
                disabled={!branches}
                onClick={() => {
                  setOpen(false);
                  setAdding(true);
                }}
                className="text-primary-strong hover:bg-primary-soft focus-visible:bg-primary-soft flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] font-semibold transition-colors focus-visible:outline-none disabled:opacity-50"
              >
                <span className="bg-primary-soft flex size-8 items-center justify-center rounded-lg">
                  <Plus className="size-4" aria-hidden />
                </span>
                เพิ่มสาขา
              </button>
            )}
          </div>
        </div>
      )}

      <AddBranchDialog open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}

function AddBranchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { shop } = useShop();
  return (
    <Dialog open={open} title="เพิ่มสาขา" onClose={onClose} className="w-[min(94vw,440px)]">
      <AddBranchForm shopName={shop?.name ?? ""} onClose={onClose} />
    </Dialog>
  );
}

function AddBranchForm({ shopName, onClose }: { shopName: string; onClose: () => void }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await shopApi.createBranch(name.trim());
      window.location.reload();
    } catch (e) {
      notify.error(e);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col">
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-1 pr-8">
          <p aria-hidden className="font-display text-xl font-semibold">
            เพิ่มสาขา
          </p>
          <p className="text-muted-foreground text-[13px]">
            สาขาใหม่ใช้ชื่อร้าน {shopName} มีโต๊ะ เมนู และพนักงานของตัวเอง หลังสร้างจะสลับไปสาขานั้นให้ทันที
          </p>
        </div>
        <FormField label="ชื่อสาขา" htmlFor="branch-name" hint="เช่น สยามสแควร์ หรือ เชียงใหม่ นิมมาน">
          <Input
            id="branch-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            autoFocus
            autoComplete="off"
          />
        </FormField>
      </div>
      <div className="border-border flex justify-end gap-3 border-t px-6 py-4">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          ยกเลิก
        </Button>
        <Button type="submit" loading={saving} disabled={!name.trim()}>
          สร้างสาขา
        </Button>
      </div>
    </form>
  );
}
