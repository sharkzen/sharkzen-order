"use client";

import { useState } from "react";
import { Info, Minus, Plus } from "lucide-react";
import { Button, Dialog } from "@/components/ui";
import { KITCHEN_CANCEL_REASONS, activeQuantity } from "../lib/kitchen-utils";
import type { KitchenItem, KitchenOrder } from "../types";
import { ReasonPicker } from "./reason-picker";

export interface ItemCancelTarget {
  order: KitchenOrder;
  item: KitchenItem;
}

interface CancelItemDialogProps {
  target: ItemCancelTarget | null;
  onClose: () => void;
  onConfirm: (
    target: ItemCancelTarget,
    quantity: number,
    reason: string,
  ) => void;
}

function CancelItemForm({
  target,
  onClose,
  onConfirm,
}: {
  target: ItemCancelTarget;
  onClose: () => void;
  onConfirm: CancelItemDialogProps["onConfirm"];
}) {
  const remaining = activeQuantity(target.item);
  const [quantity, setQuantity] = useState(remaining);
  const [reason, setReason] = useState<string>(KITCHEN_CANCEL_REASONS[0]);
  const paid = target.order.payment.state === "paid";

  return (
    <>
      <div className="flex flex-col gap-1.5 p-5 pb-4">
        <p aria-hidden className="font-display text-lg font-semibold">
          ยกเลิกเมนู “{target.item.name}”
        </p>
        <p className="text-muted-foreground text-sm">
          {target.order.id} • โต๊ะ {target.order.table}{" "}
          ส่วนรายการอื่นในออเดอร์นี้ยังทำต่อ
        </p>
      </div>

      <div className="flex flex-col gap-4 px-5 pb-5">
        {remaining > 1 && (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-foreground text-sm font-semibold">
                จำนวนที่ยกเลิก
              </p>
              <p className="text-muted-foreground text-xs">
                สั่งไว้ที่ยังไม่ยกเลิก {remaining} ที่
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="ลดจำนวนที่ยกเลิก"
                disabled={quantity <= 1}
                onClick={() => setQuantity((value) => value - 1)}
                className="border-border hover:bg-muted focus-visible:ring-primary/50 flex size-9 cursor-pointer items-center justify-center rounded-lg border focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus className="size-4" aria-hidden />
              </button>
              <span
                aria-live="polite"
                className="font-display w-10 text-center text-lg font-semibold tabular-nums"
              >
                {quantity}
              </span>
              <button
                type="button"
                aria-label="เพิ่มจำนวนที่ยกเลิก"
                disabled={quantity >= remaining}
                onClick={() => setQuantity((value) => value + 1)}
                className="border-border hover:bg-muted focus-visible:ring-primary/50 flex size-9 cursor-pointer items-center justify-center rounded-lg border focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        )}

        <ReasonPicker value={reason} onChange={setReason} name="item-reason" />

        <p className="bg-warning-soft text-warning-strong flex gap-2 rounded-lg p-3 text-xs leading-relaxed">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            หน้าร้านจะได้รับแจ้งให้ปรับยอดและบอกลูกค้า
            {paid ? " รวมถึงคืนเงินส่วนที่ยกเลิก เพราะออเดอร์นี้ชำระแล้ว" : ""}
          </span>
        </p>
      </div>

      <div className="border-border flex justify-end gap-3 border-t px-5 py-4">
        <Button variant="outline" onClick={onClose}>
          ไม่ยกเลิก
        </Button>
        <Button
          variant="danger"
          onClick={() => onConfirm(target, quantity, reason)}
        >
          ยืนยันยกเลิก {quantity} ที่
        </Button>
      </div>
    </>
  );
}

/** ยืนยันการยกเลิกรายจาน (บางจำนวนหรือทั้งหมด) ก่อนที่ครัวจะหยุดทำเมนูนั้น */
export function CancelItemDialog({
  target,
  onClose,
  onConfirm,
}: CancelItemDialogProps) {
  return (
    <Dialog
      open={target !== null}
      title="ยืนยันการยกเลิกรายการอาหาร"
      onClose={onClose}
      showClose={false}
      className="w-[min(92vw,440px)]"
    >
      {target && (
        <CancelItemForm
          target={target}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      )}
    </Dialog>
  );
}
