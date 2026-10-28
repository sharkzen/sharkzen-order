"use client";

import { useState } from "react";
import { PiCheckBold } from "react-icons/pi";
import { Button, Dialog, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { CustomerMenuItem, CustomerOptionGroup } from "@/features/customer-order/lib/customer-api";
import { price } from "@/features/customer-order/lib/format";
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
      className="m-0 h-dvh max-h-dvh w-screen max-w-none flex-col overflow-hidden rounded-none open:flex md:m-auto md:h-[min(90dvh,780px)] md:max-h-[90dvh] md:w-[min(92vw,560px)] md:rounded-lg"
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
  /** กดเพิ่มลงตะกร้าทั้งที่ยังไม่เลือกข้อบังคับ: เน้นกลุ่มที่ขาดให้เห็น */
  const [attempted, setAttempted] = useState(false);

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

  function submit() {
    if (missing) {
      setAttempted(true);
      document.getElementById(`option-group-${missing.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onAdd(item, optionIds, quantity, note.trim());
  }

  return (
    <>
      <div className="scroll-thin flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        {item.image && (
          <div className="bg-muted mx-auto aspect-square max-h-[42dvh] w-full shrink-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image} alt="" className="size-full object-contain" />
          </div>
        )}

        <div className={cn("border-border flex flex-col gap-1 border-b px-5 pb-4", item.image ? "pt-4" : "pt-5 pr-14")}>
          <h2 aria-hidden className="font-display text-foreground text-xl leading-snug font-bold">
            {item.name}
          </h2>
          {item.description && <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>}
          <p className="text-primary-strong text-base font-bold tabular-nums">เริ่มต้น {price(item.price)}</p>
        </div>

        {item.optionGroups.map((group) => {
          const selected = picked[group.id] ?? [];
          const full = group.type === "multiple" && group.max !== null && selected.length >= group.max;
          const lacking = group.required && selected.length === 0;
          return (
            <fieldset
              key={group.id}
              id={`option-group-${group.id}`}
              className="border-border flex scroll-mt-4 flex-col border-b pb-2"
            >
              <legend className="float-left flex w-full items-center justify-between gap-3 px-5 pt-5 pb-2">
                <span className="flex flex-col">
                  <span className="text-foreground text-base font-bold">{group.name}</span>
                  <span className="text-muted-foreground text-xs">{rule(group)}</span>
                </span>
                {group.required ? (
                  lacking ? (
                    <span
                      className={cn(
                        "shrink-0 rounded-sm px-2 py-1 text-xs font-semibold transition-colors",
                        attempted ? "bg-danger text-white" : "bg-primary-soft text-primary-strong",
                      )}
                    >
                      ต้องเลือก
                    </span>
                  ) : (
                    <span className="text-success-strong flex shrink-0 items-center gap-1 text-xs font-semibold">
                      <PiCheckBold className="size-3.5" aria-hidden />
                      เลือกแล้ว
                    </span>
                  )
                ) : (
                  <span className="text-muted-foreground shrink-0 text-xs">ไม่บังคับ</span>
                )}
              </legend>

              <ul className="clear-both flex flex-col">
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
                          "focus-visible:ring-primary/50 flex min-h-12 w-full cursor-pointer items-center gap-3 px-5 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50",
                          on ? "bg-primary-soft" : "hover:bg-muted",
                        )}
                      >
                        <span
                          className={cn(
                            "flex-1 text-[15px] leading-snug",
                            on ? "text-primary-strong font-semibold" : "text-foreground",
                          )}
                        >
                          {option.name}
                        </span>
                        <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
                          {!option.available ? "หมดชั่วคราว" : option.price > 0 ? `+${price(option.price)}` : ""}
                        </span>
                        <span
                          aria-hidden
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center border-2 transition-colors",
                            group.type === "single" ? "rounded-full" : "rounded-sm",
                            on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface",
                          )}
                        >
                          {on &&
                            (group.type === "single" ? (
                              <span className="bg-primary-foreground size-1.5 rounded-full" />
                            ) : (
                              <PiCheckBold className="size-3" />
                            ))}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          );
        })}

        <label className="flex flex-col gap-2 px-5 py-5">
          <span className="text-foreground text-base font-bold">
            หมายเหตุ <span className="text-muted-foreground text-sm font-normal">(ไม่บังคับ)</span>
          </span>
          <Textarea
            rows={2}
            maxLength={200}
            value={note}
            placeholder="เช่น ไม่ใส่ผัก ขอช้อนเพิ่ม"
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </div>

      <div className="border-border bg-surface flex flex-col gap-2 border-t px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {missing && (
          <p role="status" className={cn("text-center text-[13px]", attempted ? "text-danger-strong font-medium" : "text-muted-foreground")}>
            กรุณาเลือก{missing.name}ก่อนเพิ่มใส่ตะกร้า
          </p>
        )}
        <div className="flex items-center gap-3">
          <QuantityStepper
            quantity={quantity}
            name={item.name}
            onChange={(q) => setQuantity(Math.max(1, q))}
            className="h-12 w-32 shrink-0 rounded-md"
          />
          <Button
            size="lg"
            aria-disabled={missing !== undefined}
            className={cn("h-12 min-w-0 flex-1 rounded-md", missing && "opacity-60")}
            onClick={submit}
          >
            เพิ่มใส่ตะกร้า • {price(unit * quantity)}
          </Button>
        </div>
      </div>
    </>
  );
}
