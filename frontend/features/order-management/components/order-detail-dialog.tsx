"use client";

import { useState } from "react";
import { Banknote, StickyNote } from "lucide-react";
import Link from "next/link";
import { Button, Dialog, FormField, Select } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/cn";
import { formatBaht } from "@/features/dashboard/lib/format";
import type { FoodStatus, ManagedOrder } from "@/features/order-management/types";
import { FoodStatusBadge, PaymentBadge } from "./order-badges";

const NEXT_STATUS: Partial<Record<FoodStatus, { to: Exclude<FoodStatus, "cancelled">; label: string }>> = {
  new: { to: "preparing", label: "ส่งเข้าครัว" },
  preparing: { to: "ready", label: "เสิร์ฟแล้ว" },
  ready: { to: "done", label: "เสร็จสิ้น" },
};

const CANCEL_REASONS = ["ลูกค้ายกเลิก", "สั่งผิดโต๊ะ", "วัตถุดิบหมด", "ครัวทำไม่ทัน", "อื่นๆ"].map((value) => ({
  value,
  label: value,
}));

interface OrderDetailDialogProps {
  order: ManagedOrder | null;
  onClose: () => void;
  onAdvance: (order: ManagedOrder, to: Exclude<FoodStatus, "cancelled">) => Promise<void>;
  onCancel: (order: ManagedOrder, reason: string) => Promise<void>;
}

/** รายละเอียดคำสั่งซื้อ: รายการอาหาร หมายเหตุ การชำระเงิน เปลี่ยนสถานะ และยกเลิก */
export function OrderDetailDialog({ order, onClose, onAdvance, onCancel }: OrderDetailDialogProps) {
  return (
    <Dialog
      open={order !== null}
      title={order ? `คำสั่งซื้อ ${order.code}` : "คำสั่งซื้อ"}
      onClose={onClose}
      className="w-[min(94vw,520px)]"
    >
      {order && <DetailBody key={order.id} order={order} onClose={onClose} onAdvance={onAdvance} onCancel={onCancel} />}
    </Dialog>
  );
}

function DetailBody({
  order,
  onClose,
  onAdvance,
  onCancel,
}: Omit<OrderDetailDialogProps, "order"> & { order: ManagedOrder }) {
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState(CANCEL_REASONS[0].value);
  const [busy, setBusy] = useState(false);
  const next = NEXT_STATUS[order.status];
  const paid = order.paymentStatus === "paid";
  const canCancel = order.status !== "cancelled" && !paid && order.status !== "done";

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-1 pr-8">
          <p aria-hidden className="font-display text-lg font-semibold">
            คำสั่งซื้อ {order.code}
          </p>
          <p className="text-muted-foreground text-[13px]">
            {order.table} • สั่งเวลา {order.time} น.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <FoodStatusBadge status={order.status} />
          <PaymentBadge status={order.paymentStatus} method={order.paymentMethod} />
        </div>

        <ul className="border-border divide-border divide-y rounded-lg border">
          {order.items.map((item) => {
            const left = item.quantity - item.cancelledQty;
            return (
              <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3 text-[13px]">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className={cn("text-foreground", left <= 0 && "text-muted-foreground line-through")}>
                    {item.name} × {item.quantity}
                  </span>
                  {item.options.length > 0 && (
                    <span className="text-muted-foreground text-xs">
                      {item.options.map((option) => option.name).join(" • ")}
                    </span>
                  )}
                  {item.note && <span className="text-warning-strong text-xs">หมายเหตุ: {item.note}</span>}
                  {item.cancelledQty > 0 && (
                    <span className="text-danger-strong text-xs">
                      ยกเลิก {item.cancelledQty} จาน{item.cancelReason ? ` • ${item.cancelReason}` : ""}
                    </span>
                  )}
                </div>
                <span className="text-foreground shrink-0 font-medium">{formatBaht(item.price * left)}</span>
              </li>
            );
          })}
          <li className="bg-background flex items-center justify-between px-4 py-3 text-sm font-semibold">
            <span>ยอดรวม</span>
            <span>{formatBaht(order.total)}</span>
          </li>
        </ul>

        {order.notes.length > 0 && (
          <div className="bg-warning-soft text-warning-strong flex items-start gap-2 rounded-lg px-4 py-3 text-[13px]">
            <StickyNote className="mt-0.5 size-4 shrink-0" aria-hidden />
            <ul className="flex flex-col gap-0.5">
              {order.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        {order.status === "cancelled" && order.cancelReason && (
          <p className="bg-danger-soft text-danger-strong rounded-lg px-4 py-3 text-[13px]">
            เหตุผลที่ยกเลิก: {order.cancelReason}
          </p>
        )}

        {cancelling && (
          <FormField label="เหตุผลที่ยกเลิก" htmlFor="cancel-reason">
            <Select id="cancel-reason" value={reason} options={CANCEL_REASONS} onChange={setReason} />
          </FormField>
        )}
      </div>

      <div className="border-border flex flex-wrap justify-end gap-3 border-t px-6 py-4">
        {cancelling ? (
          <>
            <Button variant="outline" onClick={() => setCancelling(false)} disabled={busy}>
              ไม่ยกเลิก
            </Button>
            <Button variant="danger" loading={busy} onClick={() => run(() => onCancel(order, reason))}>
              ยืนยันยกเลิกออเดอร์
            </Button>
          </>
        ) : (
          <>
            {canCancel && (
              <Button variant="outline" onClick={() => setCancelling(true)} className="mr-auto">
                ยกเลิกออเดอร์
              </Button>
            )}
            {!paid && order.status !== "cancelled" && (
              <Link
                href={ROUTES.cashier}
                className="border-border hover:bg-muted text-foreground inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors"
              >
                <Banknote className="size-4" aria-hidden />
                ไปคิดเงิน
              </Link>
            )}
            <Button variant="outline" onClick={onClose}>
              ปิด
            </Button>
            {next && (
              <Button loading={busy} onClick={() => run(() => onAdvance(order, next.to))}>
                {next.label}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
