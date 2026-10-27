import {
  Armchair,
  Clock,
  DoorClosed,
  DoorOpen,
  Pencil,
  QrCode,
  Trash2,
} from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { DiningTable } from "../types";
import { ElapsedTime } from "./elapsed-time";

interface TableCardProps {
  table: DiningTable;
  selected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onOpen: (table: DiningTable) => void;
  onClose: (table: DiningTable) => void;
  onShowQr: (table: DiningTable) => void;
  onEdit: (table: DiningTable) => void;
  onDelete: (table: DiningTable) => void;
}

const iconButton =
  "flex size-9 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none";

/**
 * โต๊ะหนึ่งใบ ปุ่มหลักคือ "เปิดโต๊ะ" / "ปิดโต๊ะ" (กดครั้งเดียว)
 * โต๊ะที่เปิดอยู่แสดงรหัสรอบและเวลาที่เปิดมา ใช้ตรวจว่าลูกค้ากลุ่มไหนอยู่ในรอบไหน
 */
export function TableCard({
  table,
  selected,
  onSelect,
  onOpen,
  onClose,
  onShowQr,
  onEdit,
  onDelete,
}: TableCardProps) {
  const { name, zone, seats, session } = table;

  return (
    <li>
      <Card
        className={cn(
          "flex h-full flex-col gap-4 p-[18px] transition-colors",
          session && "border-success/50 bg-success-soft/40",
          selected && "ring-primary/60 ring-2",
        )}
      >
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(table.id, e.target.checked)}
            aria-label={`เลือก ${name} เพื่อพิมพ์ QR`}
            className="border-border accent-primary mt-1.5 size-4 shrink-0 cursor-pointer rounded"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="font-display text-foreground text-lg leading-snug font-semibold">
              {name}
            </p>
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              {zone} • <Armchair className="size-3.5" aria-hidden /> {seats}
              <span className="sr-only"> ที่นั่ง</span>
            </p>
          </div>
          <Badge tone={session ? "success" : "neutral"}>
            {session ? "เปิดอยู่" : "ว่าง"}
          </Badge>
        </div>

        <div className="bg-background flex min-h-[54px] flex-col justify-center rounded-lg px-3.5 py-2">
          {session ? (
            <>
              <p className="text-muted-foreground text-[11px]">รหัสรอบ</p>
              <p className="text-foreground flex items-center justify-between gap-2 text-sm font-semibold">
                <span className="font-display tracking-wide">{session.id}</span>
                <span className="text-muted-foreground flex items-center gap-1 text-xs font-normal">
                  <Clock className="size-3.5" aria-hidden />
                  <ElapsedTime openedAt={session.openedAt} />
                </span>
              </p>
            </>
          ) : (
            <p className="text-muted-foreground text-xs">
              ลูกค้าสแกน QR แล้วยังสั่งอาหารไม่ได้
            </p>
          )}
        </div>

        {session ? (
          <Button variant="outline" onClick={() => onClose(table)}>
            <DoorClosed className="size-[18px]" aria-hidden />
            ปิดโต๊ะ
          </Button>
        ) : (
          <Button onClick={() => onOpen(table)}>
            <DoorOpen className="size-[18px]" aria-hidden />
            เปิดโต๊ะ
          </Button>
        )}

        <div className="border-border mt-auto flex items-center gap-2 border-t pt-3">
          <button
            type="button"
            onClick={() => onShowQr(table)}
            className={cn(
              iconButton,
              "bg-primary-soft text-primary hover:bg-primary-muted focus-visible:ring-primary/50 mr-auto w-auto gap-1.5 px-3 text-[13px] font-semibold",
            )}
          >
            <QrCode className="size-4" aria-hidden />
            ดู QR
          </button>
          <button
            type="button"
            aria-label={`แก้ไข ${name}`}
            onClick={() => onEdit(table)}
            className={cn(
              iconButton,
              "bg-muted text-muted-foreground hover:text-foreground focus-visible:ring-primary/50",
            )}
          >
            <Pencil className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-label={`ลบ ${name}`}
            onClick={() => onDelete(table)}
            className={cn(
              iconButton,
              "bg-danger-soft text-danger hover:bg-danger/15 focus-visible:ring-danger/50",
            )}
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      </Card>
    </li>
  );
}
