import { Ban, Check, ClipboardCheck, X } from "lucide-react";
import { Badge, Button, Dialog } from "@/components/ui";
import { cn } from "@/lib/cn";
import { COLUMN_BY_STATUS } from "@/features/kitchen-display/lib/columns";
import {
  STEPS,
  activeQuantity,
  countItems,
  isUrgent,
  waitMinutes,
} from "@/features/kitchen-display/lib/kitchen-utils";
import type { KitchenItem, KitchenOrder } from "@/features/kitchen-display/types";
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

/** ความคืบหน้าของงาน 4 ขั้น อยู่ใต้ชื่อโต๊ะ ให้เห็นทันทีว่างานอยู่ขั้นไหน */
function Progress({ currentStep }: { currentStep: number }) {
  return (
    <ol className="flex items-start" aria-label="ความคืบหน้า">
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
                  "absolute top-3 right-1/2 h-0.5 w-full",
                  index <= currentStep ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex size-6 items-center justify-center rounded-full text-xs font-bold",
                (done || current) && "bg-primary text-primary-foreground",
                current && "ring-primary/25 ring-4",
                !done && !current && "bg-border text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" aria-hidden /> : index + 1}
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
  );
}

/**
 * รายละเอียดทั้งหมดที่ลูกค้าสั่งของโต๊ะนั้น
 * โครงสร้าง: หัว (โต๊ะ เวลา สถานะ ความคืบหน้า) ติดบน → เนื้อหาเลื่อนได้ (หมายเหตุขึ้นก่อน แล้วรายการอาหาร)
 * → ปุ่มติดล่าง จึงเห็นปุ่มหลักตลอดแม้รายการยาว ไม่แสดงยอดเงินเพราะครัวไม่ได้ดูแลเรื่องการเงิน
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
  const column = order ? COLUMN_BY_STATUS[order.status] : null;
  const ActionIcon = column?.actionIcon;
  const cancelled = order?.cancellation !== undefined;
  const currentStep = order
    ? STEPS.findIndex((step) => step.status === order.status)
    : 0;
  const canCancelItems = !!order && !cancelled && order.status !== "ready";

  return (
    <Dialog
      open={order !== null}
      title={
        order
          ? `รายละเอียดคำสั่งซื้อ ${order.code} โต๊ะ ${order.table}`
          : "รายละเอียดคำสั่งซื้อ"
      }
      onClose={onClose}
      className="w-[min(94vw,560px)] overflow-hidden open:flex open:flex-col"
    >
      {order && column && ActionIcon && (
        <>
          <header className="border-border flex shrink-0 flex-col gap-4 border-b px-6 pt-5 pr-14 pb-4">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p
                  aria-hidden
                  className={cn(
                    "font-display text-foreground text-[38px] leading-[1.25] font-bold",
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
              <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-[13px]">
                <span>{order.code}</span>•<span>สั่ง {order.orderedAt} น.</span>•
                <span
                  className={
                    order.payment.state === "paid"
                      ? "text-success-strong font-semibold"
                      : undefined
                  }
                >
                  {order.payment.state === "paid" ? "ชำระแล้ว" : "ยังไม่ชำระ"}
                </span>
              </p>
            </div>
            {!cancelled && <Progress currentStep={currentStep} />}
          </header>

          <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
            {cancelled && (
              <NoteStrip tone="alert">
                {`หน้าร้านยกเลิกออเดอร์นี้ • ${order.cancellation?.reason} • หยุดทำและกดรับทราบเมื่อเก็บของแล้ว`}
              </NoteStrip>
            )}

            {order.notes.length > 0 && (
              <section
                aria-labelledby="detail-notes"
                className="flex flex-col gap-2"
              >
                <h3
                  id="detail-notes"
                  className="text-warning-strong text-sm font-semibold"
                >
                  หมายเหตุจากลูกค้า อ่านก่อนทำ
                </h3>
                {order.notes.map((note) => (
                  <NoteStrip key={note} tone="note">
                    {note}
                  </NoteStrip>
                ))}
              </section>
            )}

            <section
              aria-labelledby="detail-items"
              className="flex flex-col gap-2"
            >
              <h3
                id="detail-items"
                className="text-foreground flex items-baseline justify-between text-sm font-semibold"
              >
                รายการอาหาร
                <span className="text-muted-foreground text-xs font-normal">
                  ทั้งหมด {countItems(order)} ที่
                </span>
              </h3>
              <ul className="divide-border border-border divide-y rounded-xl border">
                {order.items.map((item) => {
                  const active = activeQuantity(item);
                  const removed = item.cancelledQty ?? 0;
                  return (
                    <li
                      key={item.id}
                      className="flex flex-col gap-1 px-4 py-3"
                    >
                      {active > 0 && (
                        <div className="flex items-center gap-3">
                          <span className="text-foreground w-11 shrink-0 text-2xl leading-none font-bold tabular-nums">
                            {active}×
                          </span>
                          <span
                            className={cn(
                              "text-foreground min-w-0 flex-1 text-lg leading-snug font-medium",
                              cancelled && "line-through opacity-60",
                            )}
                          >
                            {item.name}
                            {item.options && item.options.length > 0 && (
                              <span className="text-primary-strong mt-0.5 block text-sm font-medium">
                                {item.options.join(" • ")}
                              </span>
                            )}
                            {item.note && (
                              <span className="text-warning-strong mt-0.5 block text-sm font-medium">
                                หมายเหตุ: {item.note}
                              </span>
                            )}
                          </span>
                          {canCancelItems && (
                            <button
                              type="button"
                              onClick={() => onCancelItem(order, item)}
                              aria-label={`ยกเลิกรายการ ${item.name}`}
                              className="text-muted-foreground hover:text-danger-strong hover:bg-danger-soft focus-visible:ring-danger/50 flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                            >
                              <X className="size-4" aria-hidden />
                              ยกเลิก
                            </button>
                          )}
                        </div>
                      )}
                      {removed > 0 && (
                        <p className="text-danger-strong flex items-center gap-1.5 pl-14 text-[13px]">
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
          </div>

          <footer className="border-border flex shrink-0 items-center gap-3 border-t px-6 py-4">
            {cancelled ? (
              <>
                <Button variant="outline" size="lg" onClick={onClose}>
                  ปิด
                </Button>
                <Button
                  variant="danger"
                  size="lg"
                  className="flex-1 gap-2"
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
                    variant="ghost"
                    size="lg"
                    className="text-danger-strong hover:bg-danger-soft"
                    onClick={() => onCancel(order)}
                  >
                    ยกเลิกงาน
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  className="ml-auto"
                  onClick={onClose}
                >
                  ปิด
                </Button>
                <Button
                  size="lg"
                  className={cn(
                    "min-w-[200px] flex-1 gap-2",
                    column.actionClassName,
                  )}
                  onClick={() => onAdvance(order)}
                >
                  <ActionIcon className="size-5" />
                  {column.actionLabel}
                </Button>
              </>
            )}
          </footer>
        </>
      )}
    </Dialog>
  );
}
