"use client";

import { useMemo, useState } from "react";
import {
  ClipboardList,
  CookingPot,
  Minus,
  Plus,
  Star,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Button, ConfirmDialog, Spinner } from "@/components/ui";
import { formatNumber } from "@/features/dashboard/lib/format";
import { cn } from "@/lib/cn";
import { dishCount, roundTotal } from "@/features/cashier/lib/bill-utils";
import type { BillLine, BillRound, TableBill } from "@/features/cashier/types";
import type { CashierActions } from "./cashier-workspace";
import { MenuPickerDialog } from "./menu-picker-dialog";

/** เมนูที่แคชเชียร์เพิ่มให้โต๊ะได้ (ตัดเฉพาะที่ใช้ในหน้านี้) */
export interface PickableMenu {
  id: string;
  name: string;
  price: number;
  image: string;
  featured: boolean;
  categoryId: string | null;
  /** มีกลุ่มตัวเลือกที่บังคับเลือก แคชเชียร์เพิ่มตรงๆ ไม่ได้ */
  needsOptions: boolean;
}

export interface PickableCategory {
  id: string;
  name: string;
}

type Tab = "items" | "featured" | "history";

interface OrderEditorProps {
  bill: TableBill;
  menu: PickableMenu[];
  categories: PickableCategory[];
  actions: CashierActions;
  /** แก้รายการไม่ได้ (ชำระแล้ว) */
  locked: boolean;
}

interface Row {
  round: BillRound;
  line: BillLine;
}

/**
 * ฝั่งซ้ายของจอคิดเงิน: ค้นหา/เพิ่มเมนู ปรับจำนวน ลบรายการ ดูเมนูแนะนำและประวัติการสั่งของโต๊ะ
 * ทุกการแก้ไขบันทึกลงออเดอร์จริงทันที ยอดคิดใหม่ที่ server
 */
export function OrderEditor({ bill, menu, categories, actions, locked }: OrderEditorProps) {
  const [tab, setTab] = useState<Tab>("items");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  /** รายการที่รอยืนยันการลบ */
  const [removing, setRemoving] = useState<Row | null>(null);

  const rows = useMemo<Row[]>(
    () => bill.rounds.flatMap((round) => round.lines.map((line) => ({ round, line }))),
    [bill.rounds],
  );
  const imageByName = useMemo(() => new Map(menu.map((item) => [item.name, item.image])), [menu]);
  const featured = useMemo(() => menu.filter((item) => item.featured), [menu]);
  const addedByName = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { line } of rows) counts.set(line.name, (counts.get(line.name) ?? 0) + line.quantity);
    return counts;
  }, [rows]);
  const subtotal = bill.rounds.reduce((sum, round) => sum + roundTotal(round), 0);

  async function run(key: string, task: () => Promise<boolean>) {
    if (busy) return false;
    setBusy(key);
    const ok = await task();
    setBusy(null);
    return ok;
  }

  async function add(item: PickableMenu) {
    if (locked) return;
    await run(`add:${item.id}`, () => actions.addItem(bill.tableId, item.id));
  }

  const tabs: { value: Tab; label: string; icon: typeof ClipboardList; count?: number }[] = [
    { value: "items", label: "รายการอาหาร", icon: UtensilsCrossed, count: dishCount(bill.rounds) },
    { value: "featured", label: "เมนูแนะนำ", icon: Star },
    { value: "history", label: "ประวัติการสั่ง", icon: ClipboardList },
  ];

  return (
    <section aria-label="รายการอาหารของโต๊ะ" className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div role="tablist" aria-label="มุมมองรายการ" className="flex flex-wrap gap-2">
        {tabs.map(({ value, label, icon: Icon, count }) => {
          const active = tab === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(value)}
              className={cn(
                "focus-visible:ring-primary/50 flex h-10 cursor-pointer items-center gap-2 rounded-full border px-4 text-[13px] font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
              {count !== undefined && <span className={cn(!active && "text-muted-foreground")}>({count})</span>}
            </button>
          );
        })}
      </div>

      <div className="border-border bg-surface scroll-thin min-h-[220px] flex-1 overflow-y-auto rounded-2xl border" role="tabpanel">
        {tab === "items" &&
          (rows.length === 0 ? (
            <Empty
              icon={<UtensilsCrossed className="size-6" aria-hidden />}
              title="โต๊ะนี้ยังไม่มีรายการ"
              hint={locked ? "" : "กด เพิ่มเมนู เพื่อเลือกอาหารให้โต๊ะนี้"}
            />
          ) : (
            <ul className="divide-border divide-y">
              {rows.map(({ round, line }) => (
                <li key={line.id}>
                  <LineRow
                    round={round}
                    line={line}
                    image={imageByName.get(line.name)}
                    locked={locked}
                    busy={busy === line.id}
                    disabled={busy !== null}
                    onQuantity={(quantity) =>
                      void run(line.id, () => actions.setQuantity(round.orderId, line.id, quantity))
                    }
                    onRemove={() => setRemoving({ round, line })}
                  />
                </li>
              ))}
            </ul>
          ))}

        {tab === "featured" &&
          (featured.length === 0 ? (
            <Empty
              icon={<Star className="size-6" aria-hidden />}
              title="ยังไม่มีเมนูแนะนำ"
              hint="ตั้งเมนูแนะนำได้ที่หน้าจัดการเมนู"
            />
          ) : (
            <ul className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2">
              {featured.map((item) => (
                <li key={item.id}>
                  <MenuPickRow
                    item={item}
                    framed
                    disabled={locked}
                    loading={busy === `add:${item.id}`}
                    onPick={() => void add(item)}
                  />
                </li>
              ))}
            </ul>
          ))}

        {tab === "history" &&
          (bill.rounds.length === 0 ? (
            <Empty icon={<ClipboardList className="size-6" aria-hidden />} title="ยังไม่มีประวัติการสั่ง" hint="" />
          ) : (
            <ol className="divide-border divide-y">
              {[...bill.rounds].reverse().map((round) => (
                <li key={round.orderId} className="flex flex-col gap-1.5 px-5 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-foreground text-sm font-semibold">
                      ออเดอร์ {round.code}
                      <span className="text-muted-foreground ml-2 text-xs font-normal">{round.time} น.</span>
                    </p>
                    <span
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                        round.served ? "bg-success-soft text-success-strong" : "bg-warning-soft text-warning-strong",
                      )}
                    >
                      {!round.served && <CookingPot className="size-3.5" aria-hidden />}
                      {round.served ? "เสิร์ฟแล้ว" : "ครัวกำลังทำ"}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-[13px] leading-relaxed">
                    {round.lines.map((line) => `${line.quantity}× ${line.name}`).join("  ·  ") || "ยกเลิกทุกรายการแล้ว"}
                  </p>
                  {round.notes.length > 0 && (
                    <p className="text-warning-strong text-xs">หมายเหตุ: {round.notes.join(", ")}</p>
                  )}
                </li>
              ))}
            </ol>
          ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="lg" disabled={locked} onClick={() => setPickerOpen(true)}>
          <Plus className="size-[18px]" aria-hidden />
          เพิ่มเมนู
        </Button>
        <Button
          variant="outline"
          size="lg"
          disabled={locked || rows.length === 0 || busy !== null}
          onClick={() => setConfirmClear(true)}
          className="text-danger-strong hover:bg-danger-soft hover:border-danger/40"
        >
          <Trash2 className="size-[18px]" aria-hidden />
          ล้างรายการ
        </Button>
        <p className="text-muted-foreground ml-auto flex items-baseline gap-2 text-sm">
          รวม <strong className="text-foreground">{rows.length}</strong> รายการ
          <span aria-hidden>|</span>
          <span className="font-display text-primary-strong text-xl font-semibold tabular-nums">
            ฿{formatNumber(subtotal)}
          </span>
        </p>
      </div>

      <MenuPickerDialog
        open={pickerOpen}
        tableName={bill.tableName}
        menu={menu}
        categories={categories}
        added={addedByName}
        busyId={busy?.startsWith("add:") ? busy.slice(4) : null}
        onAdd={(item) => void add(item)}
        onClose={() => setPickerOpen(false)}
      />

      <ConfirmDialog
        open={removing !== null}
        title="ลบรายการนี้?"
        description={
          removing ? `${removing.line.name} × ${removing.line.quantity} จะถูกยกเลิกจากบิลของ${bill.tableName} ย้อนกลับไม่ได้` : ""
        }
        confirmLabel="ลบรายการ"
        tone="danger"
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          const target = removing;
          setRemoving(null);
          if (target)
            void run(target.line.id, () =>
              actions.removeItem(target.round.orderId, target.line.id, target.line.quantity),
            );
        }}
      />

      <ConfirmDialog
        open={confirmClear}
        title={`ล้างรายการของ${bill.tableName}`}
        description="รายการทั้งหมดที่ยังไม่ชำระจะถูกยกเลิก ครัวจะเห็นว่าออเดอร์ถูกยกเลิก ย้อนกลับไม่ได้"
        confirmLabel="ล้างรายการ"
        tone="danger"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          setConfirmClear(false);
          void run("clear", () => actions.clearTable(bill));
        }}
      />
    </section>
  );
}

function LineRow({
  round,
  line,
  image,
  locked,
  busy,
  disabled,
  onQuantity,
  onRemove,
}: {
  round: BillRound;
  line: BillLine;
  image: string | undefined;
  locked: boolean;
  busy: boolean;
  disabled: boolean;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  const detail = [...line.options, line.note].filter(Boolean).join(" • ");
  return (
    <div
      className={cn(
        "grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 sm:grid-cols-[48px_minmax(0,1fr)_72px_112px_72px_28px] sm:px-5",
        busy && "opacity-60",
      )}
    >
      <Thumb src={image} />
      <div className="min-w-0">
        <p className="text-foreground truncate text-sm font-semibold">{line.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          {detail || `ออเดอร์ ${round.code} • ${round.time} น.`}
        </p>
      </div>
      <p className="text-foreground hidden text-right text-sm tabular-nums sm:block">฿{formatNumber(line.unitPrice)}</p>

      {locked ? (
        <p className="text-foreground text-center text-sm tabular-nums sm:col-auto">× {line.quantity}</p>
      ) : (
        <div className="border-border col-start-2 flex h-9 w-[112px] items-center justify-between rounded-lg border sm:col-auto">
          <StepButton
            label={`ลดจำนวน ${line.name}`}
            disabled={disabled || line.quantity <= 1}
            onClick={() => onQuantity(line.quantity - 1)}
          >
            <Minus className="size-4" aria-hidden />
          </StepButton>
          <span aria-live="polite" className="text-foreground text-sm font-semibold tabular-nums">
            {line.quantity}
          </span>
          <StepButton
            label={`เพิ่มจำนวน ${line.name}`}
            disabled={disabled || line.quantity >= 99}
            onClick={() => onQuantity(line.quantity + 1)}
          >
            <Plus className="size-4" aria-hidden />
          </StepButton>
        </div>
      )}

      <p className="text-foreground col-start-3 row-start-1 text-right text-sm font-semibold tabular-nums sm:col-auto sm:row-auto">
        ฿{formatNumber(line.unitPrice * line.quantity)}
      </p>
      {!locked && (
        <button
          type="button"
          aria-label={`ลบ ${line.name}`}
          disabled={disabled}
          onClick={onRemove}
          className="text-muted-foreground hover:text-danger-strong hover:bg-danger-soft focus-visible:ring-danger/40 col-start-3 flex size-8 cursor-pointer items-center justify-center justify-self-end rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 sm:col-auto"
        >
          {busy ? <Spinner className="size-4" /> : <X className="size-[18px]" aria-hidden />}
        </button>
      )}
    </div>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="text-primary-strong hover:bg-primary-soft focus-visible:ring-primary/50 flex h-full w-9 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

export function Thumb({ src }: { src: string | undefined }) {
  return (
    <span className="bg-muted flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" className="size-full object-cover" />
      ) : (
        <UtensilsCrossed className="text-muted-foreground size-5" aria-hidden />
      )}
    </span>
  );
}

function MenuPickRow({
  item,
  framed = false,
  disabled = false,
  loading,
  onPick,
}: {
  item: PickableMenu;
  framed?: boolean;
  disabled?: boolean;
  loading: boolean;
  onPick: () => void;
}) {
  const blocked = item.needsOptions;
  return (
    <button
      type="button"
      disabled={disabled || loading || blocked}
      onClick={onPick}
      className={cn(
        "hover:bg-primary-soft focus-visible:bg-primary-soft flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent",
        framed && "border-border rounded-xl border",
      )}
    >
      <Thumb src={item.image} />
      <span className="min-w-0 flex-1">
        <span className="text-foreground block truncate text-sm font-semibold">{item.name}</span>
        <span className="text-muted-foreground block text-xs">
          {blocked ? "ต้องเลือกตัวเลือก ให้ลูกค้าสั่งผ่าน QR" : `฿${formatNumber(item.price)}`}
        </span>
      </span>
      <span className="bg-primary-soft text-primary-strong flex size-8 shrink-0 items-center justify-center rounded-full">
        {loading ? <Spinner className="size-4" /> : <Plus className="size-4" aria-hidden />}
      </span>
    </button>
  );
}

function Empty({ icon, title, hint }: { icon: React.ReactNode; title: string; hint: string }) {
  return (
    <div className="text-muted-foreground flex h-full min-h-[220px] flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <span className="bg-muted flex size-12 items-center justify-center rounded-full">{icon}</span>
      <p className="text-foreground text-[15px] font-semibold">{title}</p>
      {hint && <p className="text-[13px]">{hint}</p>}
    </div>
  );
}
