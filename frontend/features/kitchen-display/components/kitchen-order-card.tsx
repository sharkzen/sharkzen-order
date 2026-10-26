import { useEffect, useRef } from "react";
import { Ban, ChevronRight, ClipboardCheck, X } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { COLUMN_BY_STATUS } from "../lib/columns";
import {
  activeQuantity,
  countItems,
  isUrgent,
  waitMinutes,
} from "../lib/kitchen-utils";
import type { KitchenOrder } from "../types";
import { NoteStrip } from "./order-notes";
import { WaitBadge } from "./wait-badge";

/** แสดงรายการอาหารบนการ์ดสูงสุดกี่รายการ ที่เหลือกด "ดูทั้งหมด" เพื่อเปิดรายละเอียด */
const MAX_VISIBLE_ITEMS = 5;
/** ออเดอร์ใหม่ที่เข้ามาไม่เกินกี่วินาทีจะกะพริบเรียกสายตา */
const FRESH_SECONDS = 10;

interface KitchenOrderCardProps {
  order: KitchenOrder;
  ticks: number;
  urgentAfter: number;
  onAdvance: (order: KitchenOrder) => void;
  onCancel: (order: KitchenOrder) => void;
  /** รับทราบว่าหน้าร้านยกเลิกแล้ว (การ์ดจะหายไป) */
  onAcknowledge: (order: KitchenOrder) => void;
  onOpen: (order: KitchenOrder) => void;
}

/**
 * การ์ดงานหนึ่งโต๊ะ (ขนาดกะทัดรัดเพื่อให้เห็นหลายงานพร้อมกัน)
 * รายการอาหารเยอะจะแสดงบางส่วนแล้วให้กดดูทั้งหมดในหน้ารายละเอียด
 * ถ้าหน้าร้านยกเลิกแล้ว การ์ดจะเป็นสีแดงและมีปุ่ม "รับทราบ" เท่านั้น
 */
export function KitchenOrderCard({
  order,
  ticks,
  urgentAfter,
  onAdvance,
  onCancel,
  onAcknowledge,
  onOpen,
}: KitchenOrderCardProps) {
  const column = COLUMN_BY_STATUS[order.status];
  const cancelled = order.cancellation !== undefined;
  const minutes = waitMinutes(order, ticks);
  const urgent = isUrgent(order, ticks, urgentAfter);
  const fresh =
    !cancelled &&
    order.status === "new" &&
    ticks > 0 &&
    ticks - order.since < FRESH_SECONDS;
  const ActionIcon = column.actionIcon;

  // ออเดอร์ที่เพิ่งเข้ามาอยู่ท้ายคอลัมน์ (เรียงตามเวลารอ) จึงเลื่อนให้เห็นทันทีตอนปรากฏ
  const ref = useRef<HTMLElement>(null);
  const arrivedFresh = useRef(fresh);
  useEffect(() => {
    if (arrivedFresh.current) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  const visibleItems = order.items.slice(0, MAX_VISIBLE_ITEMS);
  const hiddenItems = order.items.length - visibleItems.length;
  const hiddenQuantity = order.items
    .slice(MAX_VISIBLE_ITEMS)
    .reduce((sum, item) => sum + activeQuantity(item), 0);

  return (
    <article
      ref={ref}
      className={cn(
        "flex shrink-0 flex-col gap-2.5 rounded-xl border p-3.5",
        cancelled
          ? "border-danger bg-danger-soft/50 border-2"
          : "bg-surface border-border",
        !cancelled && urgent && "border-danger border-2",
        fresh && "order-fresh border-primary",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs font-semibold">
          {order.id}
        </span>
        {cancelled ? (
          <Badge tone="danger">
            <Ban className="size-[13px]" aria-hidden />
            หน้าร้านยกเลิก
          </Badge>
        ) : (
          <WaitBadge status={order.status} minutes={minutes} urgent={urgent} />
        )}
      </div>

      <button
        type="button"
        onClick={() => onOpen(order)}
        aria-label={`ดูรายละเอียดคำสั่งซื้อ ${order.id} โต๊ะ ${order.table}`}
        className="group hover:bg-background/70 focus-visible:ring-primary/50 -mx-1.5 flex cursor-pointer items-center justify-between gap-2 rounded-lg px-1.5 py-0.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <span
          className={cn(
            "font-display text-foreground text-xl leading-[1.4] font-semibold",
            cancelled && "line-through decoration-2",
          )}
        >
          โต๊ะ {order.table}
        </span>
        <span className="text-muted-foreground flex items-center gap-0.5 text-xs">
          สั่ง {order.orderedAt} น. • {countItems(order)} รายการ
          <ChevronRight
            className="text-primary size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </button>

      {cancelled && (
        <NoteStrip tone="alert">
          {`หยุดทำรายการนี้ • ${order.cancellation?.reason}`}
        </NoteStrip>
      )}

      <ul
        className={cn(
          "border-border flex flex-col gap-1.5 border-t pt-2.5",
          cancelled && "opacity-55",
        )}
      >
        {visibleItems.map((item) => {
          const active = activeQuantity(item);
          return (
            <li key={item.name} className="flex flex-col gap-1">
              {active > 0 && (
                <div className="flex items-center gap-2.5">
                  <span className="bg-background text-foreground flex h-6 w-7 shrink-0 items-center justify-center rounded-md text-sm font-bold">
                    {active}
                  </span>
                  <span
                    className={cn(
                      "text-foreground min-w-0 flex-1 text-[15px] leading-snug font-medium",
                      cancelled && "line-through",
                    )}
                  >
                    {item.name}
                  </span>
                </div>
              )}
              {(item.cancelledQty ?? 0) > 0 && (
                <p className="text-danger-strong flex items-center gap-1.5 pl-1 text-xs">
                  <X className="size-3.5 shrink-0" aria-hidden />
                  <span className="line-through">
                    {item.cancelledQty} {item.name}
                  </span>
                  <span>• ยกเลิก ({item.cancelReason})</span>
                </p>
              )}
            </li>
          );
        })}
        {hiddenItems > 0 && (
          <li>
            <button
              type="button"
              onClick={() => onOpen(order)}
              className="text-primary-strong hover:bg-primary-soft focus-visible:ring-primary/50 w-full cursor-pointer rounded-md px-2 py-1 text-left text-xs font-semibold focus-visible:ring-2 focus-visible:outline-none"
            >
              + อีก {hiddenItems} เมนู ({hiddenQuantity} ที่) • ดูทั้งหมด
            </button>
          </li>
        )}
      </ul>

      {!cancelled && urgent && (
        <NoteStrip tone="alert">
          {`ลูกค้ารออาหาร • เกิน ${urgentAfter} นาที`}
        </NoteStrip>
      )}
      {!cancelled &&
        order.notes.map((note) => (
          <NoteStrip key={note} tone="note">
            {note}
          </NoteStrip>
        ))}
      {!cancelled && order.status === "ready" && order.pickupSlot && (
        <NoteStrip tone="ready">{`พร้อมที่ช่องรับอาหาร ${order.pickupSlot}`}</NoteStrip>
      )}

      {cancelled ? (
        <Button
          variant="danger"
          className="h-10 w-full gap-2 text-sm"
          onClick={() => onAcknowledge(order)}
        >
          <ClipboardCheck className="size-[18px]" aria-hidden />
          รับทราบ เอาออกจากกระดาน
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button
            className={cn("h-10 flex-1 gap-2 text-sm", column.actionClassName)}
            onClick={() => onAdvance(order)}
          >
            <ActionIcon className="size-[18px]" />
            {column.actionLabel}
          </Button>
          {order.status !== "ready" && (
            <Button
              variant="outline"
              className="text-danger-strong hover:bg-danger-soft hover:border-danger/40 h-10 gap-1 px-3 text-sm"
              onClick={() => onCancel(order)}
              aria-label={`ยกเลิกคำสั่งซื้อ ${order.id} โต๊ะ ${order.table}`}
            >
              <X className="size-4" aria-hidden />
              ยกเลิก
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
