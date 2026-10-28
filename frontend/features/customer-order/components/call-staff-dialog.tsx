import { BellRing } from "lucide-react";
import { Button, Dialog } from "@/components/ui";

interface CallStaffDialogProps {
  open: boolean;
  tableName: string;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** ยืนยันก่อนเรียกพนักงาน กันกดพลาด (พนักงานจะได้รับแจ้งทันทีที่กดยืนยัน) */
export function CallStaffDialog({ open, tableName, loading, onConfirm, onClose }: CallStaffDialogProps) {
  return (
    <Dialog open={open} title="เรียกพนักงาน" onClose={onClose} showClose={false} className="w-[min(92vw,380px)]">
      <div className="flex flex-col items-center gap-5 p-6 text-center">
        <span className="bg-primary-soft text-primary-strong flex size-14 items-center justify-center rounded-full">
          <BellRing className="size-7" aria-hidden />
        </span>
        <div className="flex flex-col gap-1.5">
          <p className="font-display text-foreground text-xl">เรียกพนักงานมาที่{tableName}?</p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            พนักงานจะได้รับแจ้งทันทีและมาที่โต๊ะของคุณ
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-3">
          <Button variant="outline" size="lg" onClick={onClose} disabled={loading}>
            ยกเลิก
          </Button>
          <Button size="lg" loading={loading} onClick={onConfirm}>
            เรียกพนักงาน
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
