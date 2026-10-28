"use client";

import { useState } from "react";
import { MessageSquarePlus, Send, ShoppingBasket } from "lucide-react";
import { Button, Textarea } from "@/components/ui";
import type { ResolvedLine } from "@/features/customer-order/lib/cart";
import { baht } from "@/features/customer-order/lib/format";
import { QuantityStepper } from "./quantity-stepper";

export interface CartPanelProps {
  lines: ResolvedLine[];
  total: number;
  /** หมายเหตุของทั้งออเดอร์ */
  note: string;
  submitting: boolean;
  onNote: (note: string) => void;
  /** หมายเหตุของแต่ละเมนู */
  onLineNote: (key: string, note: string) => void;
  onChange: (key: string, quantity: number) => void;
  onSubmit: () => void;
}

export function CartEmpty() {
  return (
    <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center text-sm">
      <span className="bg-primary-soft text-primary flex size-12 items-center justify-center rounded-full">
        <ShoppingBasket className="size-6" aria-hidden />
      </span>
      ยังไม่ได้เลือกเมนู
      <span className="text-xs">แตะที่เมนูที่ชอบเพื่อเพิ่มลงตะกร้า</span>
    </div>
  );
}

/** รายการในตะกร้า: ปรับจำนวนและเขียนหมายเหตุให้แต่ละเมนูได้ (เช่น ไม่ใส่ผัก ไม่เอาน้ำแข็ง) */
export function CartLines({
  lines,
  note,
  onNote,
  onLineNote,
  onChange,
}: Pick<CartPanelProps, "lines" | "note" | "onNote" | "onLineNote" | "onChange">) {
  // เมนูที่เปิดช่องหมายเหตุอยู่ (เมนูที่มีหมายเหตุแล้วเปิดเสมอ)
  const [opened, setOpened] = useState<Set<string>>(new Set());

  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col gap-3">
        {lines.map(({ key, item, optionNames, unitPrice, quantity, note: lineNote }) => {
          const noteOpen = opened.has(key) || lineNote !== "";
          return (
            <li key={key} className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-foreground text-[15px] leading-snug font-semibold">{item.name}</p>
                  {optionNames.length > 0 && (
                    <p className="text-muted-foreground mt-0.5 text-[13px] leading-relaxed">{optionNames.join(" • ")}</p>
                  )}
                </div>
                <p className="text-foreground shrink-0 text-[15px] font-semibold tabular-nums">
                  {baht(unitPrice * quantity)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-muted-foreground text-[13px] tabular-nums">
                  {baht(unitPrice)}
                  {quantity > 1 && ` × ${quantity}`}
                </p>
                <QuantityStepper
                  variant="compact"
                  quantity={quantity}
                  name={item.name}
                  onChange={(q) => onChange(key, q)}
                />
              </div>

              {noteOpen ? (
                <Textarea
                  rows={2}
                  maxLength={200}
                  aria-label={`หมายเหตุของ ${item.name}`}
                  placeholder="หมายเหตุ"
                  value={lineNote}
                  autoFocus={lineNote === ""}
                  onChange={(e) => onLineNote(key, e.target.value)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setOpened((current) => new Set(current).add(key))}
                  className="text-primary-strong hover:bg-primary-soft focus-visible:ring-primary/50 -mx-1 flex h-10 w-fit cursor-pointer items-center gap-2 rounded-lg px-2 text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <MessageSquarePlus className="size-4" aria-hidden />
                  เพิ่มหมายเหตุ
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <label className="flex flex-col gap-1.5">
        <span className="text-foreground text-sm font-semibold">
          หมายเหตุถึงครัว <span className="text-muted-foreground font-normal">(ทั้งออเดอร์ ไม่บังคับ)</span>
        </span>
        <Textarea
          rows={2}
          maxLength={200}
          value={note}
          placeholder="หมายเหตุ"
          onChange={(e) => onNote(e.target.value)}
        />
      </label>
    </div>
  );
}

/** ยอดรวมและปุ่มส่งเข้าครัว */
export function CartFooter({
  total,
  count,
  submitting,
  onSubmit,
}: Pick<CartPanelProps, "total" | "submitting" | "onSubmit"> & { count: number }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="text-muted-foreground text-sm">ยอดรวม {count} รายการ</span>
        <span className="font-display text-foreground text-2xl tabular-nums">{baht(total)}</span>
      </div>
      <Button size="lg" loading={submitting} onClick={onSubmit}>
        {!submitting && <Send className="size-4" aria-hidden />}
        ส่งออเดอร์เข้าครัว
      </Button>
    </div>
  );
}

/** ตะกร้าแบบรวมในแถบข้างจอ (แท็บเล็ตแนวนอนขึ้นไป) */
export function CartPanel(props: CartPanelProps) {
  if (props.lines.length === 0) return <CartEmpty />;
  const count = props.lines.reduce((sum, line) => sum + line.quantity, 0);
  return (
    <div className="flex flex-col gap-5">
      <CartLines {...props} />
      <div className="border-border border-t pt-4">
        <CartFooter total={props.total} count={count} submitting={props.submitting} onSubmit={props.onSubmit} />
      </div>
    </div>
  );
}
