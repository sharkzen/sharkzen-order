"use client";

import { useState } from "react";
import {
  PiArrowRightBold,
  PiBasketFill,
  PiCheckCircleFill,
  PiCrownSimpleFill,
  PiNotePencilBold,
  PiShoppingCartSimpleFill,
  PiTrashBold,
} from "react-icons/pi";
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
        <PiBasketFill className="size-6" aria-hidden />
      </span>
      ยังไม่ได้เลือกเมนู
      <span className="text-xs">แตะที่เมนูที่ชอบเพื่อเพิ่มลงตะกร้า</span>
    </div>
  );
}

/** รายการในตะกร้า: รูป ชื่อ ตัวเลือก ราคา พร้อมปรับจำนวน ลบ และเขียนหมายเหตุให้แต่ละเมนู (เช่น ไม่ใส่ผัก) */
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
    <div className="flex flex-col gap-4">
      <ul className="border-border bg-surface divide-border divide-y overflow-hidden rounded-2xl border">
        {lines.map(({ key, item, optionNames, unitPrice, quantity, note: lineNote }) => {
          const noteOpen = opened.has(key) || lineNote !== "";
          return (
            <li key={key} className="flex flex-col gap-2 p-3">
              <div className="flex items-center gap-3">
                <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-xl">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="size-full object-contain" />
                  )}
                  {item.featured && (
                    <span className="bg-primary text-primary-foreground absolute top-1 left-1 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                      <PiCrownSimpleFill className="size-2.5" aria-hidden />
                      แนะนำ
                    </span>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="text-foreground text-sm leading-snug font-bold">{item.name}</p>
                  {optionNames.length > 0 && (
                    <p className="text-muted-foreground text-[11px] leading-snug">{optionNames.join(" • ")}</p>
                  )}
                  <p className="text-primary-strong text-sm font-bold tabular-nums">{baht(unitPrice * quantity)}</p>
                </div>

                <QuantityStepper
                  variant="pill"
                  quantity={quantity}
                  name={item.name}
                  onChange={(q) => onChange(key, q)}
                  className="shrink-0"
                />
                <button
                  type="button"
                  aria-label={`เอา ${item.name} ออกจากตะกร้า`}
                  onClick={() => onChange(key, 0)}
                  className="text-danger hover:bg-danger-soft focus-visible:ring-danger/50 -mr-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <PiTrashBold className="size-[18px]" aria-hidden />
                </button>
              </div>

              {noteOpen ? (
                <Textarea
                  rows={2}
                  maxLength={200}
                  aria-label={`หมายเหตุของ ${item.name}`}
                  placeholder="เช่น ไม่ใส่ผัก ไม่เผ็ด"
                  value={lineNote}
                  autoFocus={lineNote === ""}
                  onChange={(e) => onLineNote(key, e.target.value)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setOpened((current) => new Set(current).add(key))}
                  className="text-muted-foreground hover:text-primary-strong focus-visible:ring-primary/50 flex w-fit cursor-pointer items-center gap-1.5 rounded text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <PiNotePencilBold className="size-3.5" aria-hidden />
                  เพิ่มหมายเหตุ
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <label className="flex flex-col gap-1.5">
        <span className="text-foreground text-sm font-semibold">
          ฝากบอกครัว <span className="text-muted-foreground font-normal">(ไม่บังคับ)</span>
        </span>
        <Textarea
          rows={2}
          maxLength={200}
          value={note}
          placeholder="เช่น ขอช้อนเพิ่ม"
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
      <div className="flex items-center justify-between gap-3">
        <span className="text-foreground text-sm font-bold">
          รวมทั้งหมด <span className="text-muted-foreground font-normal">({count} รายการ)</span>
        </span>
        <span className="font-display text-foreground text-2xl font-bold tabular-nums">{baht(total)}</span>
      </div>
      <p className="text-muted-foreground flex items-center gap-2 text-xs">
        <PiCheckCircleFill className="text-primary size-4 shrink-0" aria-hidden />
        สั่งอาหารกับเรา อร่อย สะอาด มั่นใจได้
      </p>
      <Button size="lg" loading={submitting} onClick={onSubmit} className="relative h-14 rounded-full text-lg">
        {!submitting && <PiShoppingCartSimpleFill className="absolute left-5 size-6" aria-hidden />}
        สั่งอาหารเลย
        {!submitting && (
          <span className="bg-surface text-primary-strong absolute right-2 flex size-10 items-center justify-center rounded-full">
            <PiArrowRightBold className="size-5" aria-hidden />
          </span>
        )}
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
