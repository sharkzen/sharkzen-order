"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button, Dialog, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { CustomerMenuItem, CustomerOptionGroup } from "@/features/customer-order/lib/customer-api";
import { baht } from "@/features/customer-order/lib/format";
import { QuantityStepper } from "./quantity-stepper";

interface OptionSheetProps {
  item: CustomerMenuItem | null;
  onAdd: (item: CustomerMenuItem, optionIds: string[], quantity: number, note: string) => void;
  onClose: () => void;
}

/** เลือกตัวเลือกของเมนู (ความเผ็ด เย็น/ปั่น ท็อปปิ้ง ฯลฯ) ก่อนเพิ่มลงตะกร้า */
export function OptionSheet({ item, onAdd, onClose }: OptionSheetProps) {
  return (
    <Dialog
      open={item !== null}
      title={item ? `เลือกตัวเลือก ${item.name}` : "เลือกตัวเลือก"}
      onClose={onClose}
      className="m-0 h-dvh max-h-dvh w-screen max-w-none flex-col overflow-hidden rounded-none open:flex md:m-auto md:h-[min(90dvh,780px)] md:max-h-[90dvh] md:w-[min(92vw,640px)] md:rounded-2xl"
    >
      {item && <OptionBody key={item.id} item={item} onAdd={onAdd} />}
    </Dialog>
  );
}

const rule = (group: CustomerOptionGroup) =>
  group.type === "single"
    ? "เลือกได้ 1 ข้อ"
    : group.max
      ? `เลือกได้สูงสุด ${group.max} ข้อ`
      : "เลือกได้หลายข้อ";

function OptionBody({ item, onAdd }: { item: CustomerMenuItem; onAdd: OptionSheetProps["onAdd"] }) {
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  function toggle(group: CustomerOptionGroup, optionId: string) {
    setPicked((current) => {
      const selected = current[group.id] ?? [];
      if (group.type === "single") {
        // กดข้อเดิมซ้ำ = ยกเลิก (ใช้กับกลุ่มที่ไม่บังคับ)
        return { ...current, [group.id]: selected[0] === optionId && !group.required ? [] : [optionId] };
      }
      if (selected.includes(optionId)) return { ...current, [group.id]: selected.filter((id) => id !== optionId) };
      if (group.max && selected.length >= group.max) return current;
      return { ...current, [group.id]: [...selected, optionId] };
    });
  }

  const optionIds = item.optionGroups.flatMap((group) => picked[group.id] ?? []);
  const extra = item.optionGroups
    .flatMap((group) => group.options)
    .filter((option) => optionIds.includes(option.id))
    .reduce((sum, option) => sum + option.price, 0);
  const unit = item.price + extra;
  const missing = item.optionGroups.find((group) => group.required && (picked[group.id] ?? []).length === 0);

  return (
    <>
      <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain pb-5">
        {item.image && (
          <div className="bg-muted aspect-[16/10] w-full shrink-0 overflow-hidden md:aspect-[16/8]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image} alt="" className="size-full object-cover" />
          </div>
        )}

        <div className={cn("flex flex-col gap-1 px-5", !item.image && "pt-4 pr-14")}>
          <h2 aria-hidden className="font-display text-foreground text-2xl leading-snug">
            {item.name}
          </h2>
          {item.description && <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>}
          <p className="text-primary-strong pt-1 text-lg font-bold tabular-nums">เริ่มต้น {baht(item.price)}</p>
        </div>

        <div className="flex flex-col gap-6 px-5">
        {item.optionGroups.map((group) => {
          const selected = picked[group.id] ?? [];
          const full = group.type === "multiple" && group.max !== null && selected.length >= group.max;
          return (
            <fieldset key={group.id} className="flex flex-col gap-2.5">
              <legend className="flex w-full items-center justify-between gap-3 pb-1">
                <span className="flex flex-col">
                  <span className="text-foreground text-base font-semibold">{group.name}</span>
                  <span className="text-muted-foreground text-xs">{rule(group)}</span>
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                    group.required ? "bg-primary-soft text-primary-strong" : "bg-muted text-muted-foreground",
                  )}
                >
                  {group.required ? "ต้องเลือก" : "ไม่บังคับ"}
                </span>
              </legend>

              <ul className="flex flex-col gap-2">
                {group.options.map((option) => {
                  const on = selected.includes(option.id);
                  const disabled = !option.available || (!on && full);
                  return (
                    <li key={option.id}>
                      <button
                        type="button"
                        role={group.type === "single" ? "radio" : "checkbox"}
                        aria-checked={on}
                        disabled={disabled}
                        onClick={() => toggle(group, option.id)}
                        className={cn(
                          "focus-visible:ring-primary/50 flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                          on ? "border-primary bg-primary-soft" : "border-border bg-surface hover:bg-muted",
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center border transition-colors",
                            group.type === "single" ? "rounded-full" : "rounded-md",
                            on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface",
                          )}
                        >
                          {on && <Check className="size-3.5" strokeWidth={3} />}
                        </span>
                        <span className="text-foreground flex-1 text-[15px] leading-snug">{option.name}</span>
                        <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
                          {!option.available ? "หมดชั่วคราว" : option.price > 0 ? `+${baht(option.price)}` : ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          );
        })}

          <label className="flex flex-col gap-2">
            <span className="text-foreground text-base font-semibold">
              หมายเหตุ <span className="text-muted-foreground text-sm font-normal">(ไม่บังคับ)</span>
            </span>
            <Textarea
              rows={2}
              maxLength={200}
              value={note}
              placeholder="หมายเหตุ"
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="border-border bg-surface flex flex-col gap-3 border-t px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {missing && (
          <p role="status" className="text-warning-strong text-center text-[13px]">
            กรุณาเลือก{missing.name}ก่อนเพิ่มลงตะกร้า
          </p>
        )}
        <div className="flex items-center gap-3">
          <QuantityStepper
            quantity={quantity}
            name={item.name}
            onChange={(q) => setQuantity(Math.max(1, q))}
            className="w-36 shrink-0"
          />
          <Button size="lg" className="min-w-0 flex-1" disabled={missing !== undefined} onClick={() => onAdd(item, optionIds, quantity, note.trim())}>
            เพิ่มลงตะกร้า • {baht(unit * quantity)}
          </Button>
        </div>
      </div>
    </>
  );
}
