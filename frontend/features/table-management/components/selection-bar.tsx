import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui";

interface SelectionBarProps {
  count: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onClear: () => void;
  onPrint: () => void;
}

/** แถบลอยด้านล่างเมื่อเลือกโต๊ะ: พิมพ์ QR ของโต๊ะที่เลือกพร้อมกันได้ */
export function SelectionBar({
  count,
  allSelected,
  onToggleAll,
  onClear,
  onPrint,
}: SelectionBarProps) {
  return (
    <div
      role="region"
      aria-label="โต๊ะที่เลือก"
      className="bg-surface border-border shadow-float sticky bottom-4 z-20 mx-auto flex w-full max-w-xl flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3"
    >
      <p className="text-foreground text-sm font-semibold">
        เลือกแล้ว {count} โต๊ะ
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onToggleAll}>
          {allSelected ? "ไม่เลือกทั้งหมด" : "เลือกทั้งหมด"}
        </Button>
        <Button variant="outline" size="sm" onClick={onClear}>
          <X className="size-4" aria-hidden />
          ล้าง
        </Button>
        <Button size="sm" onClick={onPrint}>
          <Printer className="size-4" aria-hidden />
          พิมพ์ QR
        </Button>
      </div>
    </div>
  );
}
