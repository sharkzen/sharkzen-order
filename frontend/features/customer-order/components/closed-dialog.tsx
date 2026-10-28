import { BellRing } from "lucide-react";
import { Button, Dialog } from "@/components/ui";
import type { BlockReason } from "@/features/customer-order/lib/customer-api";

const COPY: Record<BlockReason, { title: string; body: string }> = {
  TABLE_CLOSED: {
    title: "โต๊ะนี้ยังไม่เปิดให้สั่งอาหาร",
    body: "พนักงานต้องเปิดโต๊ะให้ก่อนจึงจะสั่งผ่านมือถือได้",
  },
  SHOP_CLOSED: {
    title: "ร้านปิดรับออเดอร์ชั่วคราว",
    body: "ตอนนี้ร้านยังไม่รับออเดอร์ใหม่ผ่านระบบ",
  },
};

interface ClosedDialogProps {
  open: boolean;
  reason: BlockReason | null;
  tableName: string;
  onClose: () => void;
}

/** แจ้งว่าสั่งไม่ได้ในตอนนี้ พร้อมบอกให้เรียกพนักงาน (ดูเมนูต่อได้) */
export function ClosedDialog({ open, reason, tableName, onClose }: ClosedDialogProps) {
  const copy = COPY[reason ?? "TABLE_CLOSED"];

  return (
    <Dialog open={open} title={copy.title} onClose={onClose} showClose={false} className="w-[min(92vw,380px)]">
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        <span className="bg-warning-soft text-warning-strong flex size-14 items-center justify-center rounded-full">
          <BellRing className="size-7" aria-hidden />
        </span>
        <div className="flex flex-col gap-1.5">
          <p className="font-display text-foreground text-xl">{copy.title}</p>
          <p className="text-muted-foreground text-sm leading-relaxed">{copy.body}</p>
        </div>
        <p className="bg-muted text-foreground w-full rounded-lg px-4 py-3 text-sm font-medium">
          กรุณาเรียกพนักงานที่ {tableName} เพื่อให้ช่วยสั่งอาหาร
        </p>
        <Button variant="outline" size="lg" className="w-full" onClick={onClose}>
          ดูเมนูก่อน
        </Button>
      </div>
    </Dialog>
  );
}
