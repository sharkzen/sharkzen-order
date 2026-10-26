"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Button, Dialog } from "@/components/ui";
import { KITCHEN_CANCEL_REASONS, countItems } from "../lib/kitchen-utils";
import type { KitchenOrder } from "../types";
import { ReasonPicker } from "./reason-picker";

interface CancelOrderDialogProps {
  order: KitchenOrder | null;
  onClose: () => void;
  onConfirm: (order: KitchenOrder, reason: string) => void;
}

function CancelForm({
  order,
  onClose,
  onConfirm,
}: {
  order: KitchenOrder;
  onClose: () => void;
  onConfirm: (order: KitchenOrder, reason: string) => void;
}) {
  const [reason, setReason] = useState<string>(KITCHEN_CANCEL_REASONS[0]);
  const paid = order.payment.state === "paid";

  return (
    <>
      <div className="flex flex-col gap-1.5 p-5 pb-4">
        <p aria-hidden className="font-display text-lg font-semibold">
          ยกเลิกคำสั่งซื้อนี้หรือไม่?
        </p>
        <p className="text-muted-foreground text-sm">
          {order.id} • โต๊ะ {order.table} • {countItems(order)} รายการ
          ครัวจะหยุดทำรายการนี้และออกจากกระดานทันที
        </p>
      </div>

      <div className="flex flex-col gap-4 px-5 pb-5">
        <ReasonPicker
          value={reason}
          onChange={setReason}
          name="cancel-reason"
        />

        <p className="bg-warning-soft text-warning-strong flex gap-2 rounded-lg p-3 text-xs leading-relaxed">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            ระบบจะแจ้งหน้าร้านให้ติดต่อลูกค้า
            {paid
              ? " และดำเนินการคืนเงิน เพราะออเดอร์นี้ชำระแล้ว"
              : " (ออเดอร์นี้ยังไม่ได้ชำระ)"}{" "}
            หากลูกค้าเป็นฝ่ายขอยกเลิก ให้หน้าร้านยกเลิกที่หน้า
            “จัดการคำสั่งซื้อ”
          </span>
        </p>
      </div>

      <div className="border-border flex justify-end gap-3 border-t px-5 py-4">
        <Button variant="outline" onClick={onClose}>
          ไม่ยกเลิก
        </Button>
        <Button variant="danger" onClick={() => onConfirm(order, reason)}>
          ยืนยันยกเลิก
        </Button>
      </div>
    </>
  );
}

/** กล่องยืนยันก่อนที่ครัวจะยกเลิกคำสั่งซื้อ (เหตุผลฝั่งครัวเท่านั้น) พร้อมบอกว่าหน้าร้านจะได้รับแจ้ง */
export function CancelOrderDialog({
  order,
  onClose,
  onConfirm,
}: CancelOrderDialogProps) {
  return (
    <Dialog
      open={order !== null}
      title="ยืนยันการยกเลิกคำสั่งซื้อ"
      onClose={onClose}
      showClose={false}
      className="w-[min(92vw,440px)]"
    >
      {order && (
        <CancelForm order={order} onClose={onClose} onConfirm={onConfirm} />
      )}
    </Dialog>
  );
}
