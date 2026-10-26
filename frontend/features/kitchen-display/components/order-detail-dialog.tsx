import { Ban, Check, ClipboardCheck, X } from "lucide-react";
import { Badge, Button, Dialog } from "@/components/ui";
import { cn } from "@/lib/cn";
import { COLUMN_BY_STATUS } from "../lib/columns";
import {
  STEPS,
  activeQuantity,
  countItems,
  isUrgent,
  waitMinutes,
} from "../lib/kitchen-utils";
import type { KitchenItem, KitchenOrder } from "../types";
import { NoteStrip } from "./order-notes";
import { WaitBadge } from "./wait-badge";

interface OrderDetailDialogProps {
  order: KitchenOrder | null;
  ticks: number;
  urgentAfter: number;
  onClose: () => void;
  onAdvance: (order: KitchenOrder) => void;
  onCancel: (order: KitchenOrder) => void;
  onCancelItem: (order: KitchenOrder, item: KitchenItem) => void;
  onAcknowledge: (order: KitchenOrder) => void;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background flex flex-col gap-0.5 rounded-lg px-3.5 py-2.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-foreground text-sm font-semibold">{value}</dd>
    </div>
  );
}

/**
 * รายละเอียดทั้งหมดที่ลูกค้าสั่งของโต๊ะนั้น: รายการ (ยกเลิกรายจานได้) หมายเหตุ เวลา การชำระเงิน และความคืบหน้า
 * ไม่แสดงยอดเงิน เพราะครัวไม่ได้ดูแลเรื่องการเงิน
 */
export function OrderDetailDialog({
  order,
  ticks,
  urgentAfter,
  onClose,
  onAdvance,
  onCancel,
  onCancelItem,
  onAcknowledge,
}: OrderDetailDialogProps) {
  const open = order !== null;
  const column = order ? COLUMN_BY_STATUS[order.status] : null;
  const ActionIcon = column?.actionIcon;
  const cancelled = order?.cancellation !== undefined;
  const currentStep = order
    ? STEPS.findIndex((step) => step.status === order.status)
    : 0;
  const canCancelItems =
    order !== undefined &&
    order !== null &&
    !cancelled &&
    order.status !== "ready";

  return (
    <Dialog
      open={open}
      title={
        order
          ? `รายละเอียดคำสั่งซื้อ ${order.id} โต๊ะ ${order.table}`
          : "รายละเอียดคำสั่งซื้อ"
      }
      onClose={onClose}
      className="w-[min(94vw,520px)]"
    >
      {order && column && ActionIcon && (
        <>
          <div className="border-border flex flex-col gap-2 border-b px-6 pt-6 pr-14 pb-5">
            <p className="text-muted-foreground text-sm font-semibold">
              {order.id}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <p
                aria-hidden
                className={cn(
                  "font-display text-foreground text-[34px] leading-[1.3] font-semibold",
                  cancelled && "line-through decoration-2",
                )}
              >
                โต๊ะ {order.table}
              </p>
              {cancelled ? (
                <Badge tone="danger">
                  <Ban className="size-[13px]" aria-hidden />
                  หน้าร้านยกเลิก
                </Badge>
              ) : (
                <WaitBadge
                  status={order.status}
                  minutes={waitMinutes(order, ticks)}
                  urgent={isUrgent(order, ticks, urgentAfter)}
                />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6 px-6 py-5">
            {cancelled && (
              <NoteStrip tone="alert">
                {`หน้าร้านยกเลิกออเดอร์นี้ • ${order.cancellation?.reason} • หยุดทำและกดรับทราบเมื่อเก็บของแล้ว`}
              </NoteStrip>
            )}

            <dl className="grid grid-cols-3 gap-3">
              <Fact label="เวลาที่สั่ง" value={`${order.orderedAt} น.`} />
              <Fact
                label="จำนวนที่ต้องทำ"
                value={`${countItems(order)} รายการ`}
              />
              <Fact
                label="การชำระเงิน"
                value={
                  order.payment.state === "paid" ? `ชำระแล้ว` : "ยังไม่ชำระ"
                }
              />
            </dl>

            {order.status === "ready" && order.pickupSlot && !cancelled && (
              <NoteStrip tone="ready">{`พร้อมที่ช่องรับอาหาร ${order.pickupSlot}`}</NoteStrip>
            )}

            <section
              aria-labelledby="detail-items"
              className="flex flex-col gap-3"
            >
              <h3
                id="detail-items"
                className="text-foreground text-sm font-semibold"
              >
                รายการอาหารที่ลูกค้าสั่ง
              </h3>
              <ul className="scroll-thin border-border divide-border max-h-[260px] divide-y overflow-y-auto rounded-lg border">
                {order.items.map((item) => {
                  const active = activeQuantity(item);
                  const removed = item.cancelledQty ?? 0;
                  return (
                    <li
                      key={item.name}
                      className="flex flex-col gap-1.5 px-4 py-3"
                    >
                      {active > 0 && (
                        <div className="flex items-center gap-3">
                          <span className="bg-primary-soft text-primary-strong flex h-8 min-w-9 items-center justify-center rounded-md px-1 text-base font-bold">
                            × {active}
                          </span>
                          <span
                            className={cn(
                              "text-foreground min-w-0 flex-1 text-base font-medium",
                              cancelled && "line-through opacity-60",
                            )}
                          >
                            {item.name}
                          </span>
                          {canCancelItems && (
                            <button
                              type="button"
                              onClick={() => onCancelItem(order, item)}
                              aria-label={`ยกเลิกรายการ ${item.name}`}
                              className="text-danger-strong hover:bg-danger-soft focus-visible:ring-danger/50 flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-md px-2.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
                            >
                              <X className="size-3.5" aria-hidden />
                              ยกเลิกจานนี้
                            </button>
                          )}
                        </div>
                      )}
                      {removed > 0 && (
                        <p className="text-danger-strong flex items-center gap-1.5 text-xs">
                          <X className="size-3.5 shrink-0" aria-hidden />
                          <span className="line-through">
                            {removed} {item.name}
                          </span>
                          <span>• ยกเลิกแล้ว ({item.cancelReason})</span>
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            <section
              aria-labelledby="detail-notes"
              className="flex flex-col gap-3"
            >
              <h3
                id="detail-notes"
                className="text-foreground text-sm font-semibold"
              >
                หมายเหตุพิเศษจากลูกค้า
              </h3>
              {order.notes.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {order.notes.map((note) => (
                    <NoteStrip key={note} tone="note">
                      {note}
                    </NoteStrip>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  ลูกค้าไม่ได้ระบุหมายเหตุ
                </p>
              )}
            </section>

            {!cancelled && (
              <section
                aria-labelledby="detail-progress"
                className="flex flex-col gap-3"
              >
                <h3
                  id="detail-progress"
                  className="text-foreground text-sm font-semibold"
                >
                  ความคืบหน้า
                </h3>
                <ol className="flex items-start">
                  {STEPS.map((step, index) => {
                    const done = index < currentStep;
                    const current = index === currentStep;
                    return (
                      <li
                        key={step.status}
                        aria-current={current ? "step" : undefined}
                        className="relative flex flex-1 flex-col items-center gap-1.5 text-center"
                      >
                        {index > 0 && (
                          <span
                            aria-hidden
                            className={cn(
                              "absolute top-3.5 right-1/2 h-0.5 w-full",
                              index <= currentStep ? "bg-primary" : "bg-border",
                            )}
                          />
                        )}
                        <span
                          className={cn(
                            "relative z-10 flex size-7 items-center justify-center rounded-full text-xs font-bold",
                            done && "bg-primary text-primary-foreground",
                            current &&
                              "bg-primary text-primary-foreground ring-primary/25 ring-4",
                            !done &&
                              !current &&
                              "bg-border text-muted-foreground",
                          )}
                        >
                          {done ? (
                            <Check className="size-4" aria-hidden />
                          ) : (
                            index + 1
                          )}
                        </span>
                        <span
                          className={cn(
                            "text-xs",
                            current
                              ? "text-foreground font-semibold"
                              : "text-muted-foreground",
                          )}
                        >
                          {step.label}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}
          </div>

          <div className="border-border flex items-center gap-3 border-t px-6 py-4">
            {cancelled ? (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={onClose}
                >
                  ปิด
                </Button>
                <Button
                  variant="danger"
                  size="lg"
                  className="flex-[2] gap-2"
                  onClick={() => onAcknowledge(order)}
                >
                  <ClipboardCheck className="size-5" aria-hidden />
                  รับทราบ เอาออกจากกระดาน
                </Button>
              </>
            ) : (
              <>
                {order.status !== "ready" && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-danger-strong hover:bg-danger-soft hover:border-danger/40"
                    onClick={() => onCancel(order)}
                  >
                    ยกเลิกงาน
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={onClose}
                >
                  ปิด
                </Button>
                <Button
                  size="lg"
                  className={cn("flex-[2] gap-2", column.actionClassName)}
                  onClick={() => onAdvance(order)}
                >
                  <ActionIcon className="size-5" />
                  {column.actionLabel}
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </Dialog>
  );
}
