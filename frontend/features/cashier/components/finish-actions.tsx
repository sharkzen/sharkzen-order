import { Printer } from "lucide-react";
import { Button } from "@/components/ui";
import type { FinishAction } from "@/features/cashier/types";

interface FinishActionsProps {
  onFinish: (action: FinishAction) => void;
  autoFocus?: boolean;
}

/** สามทางเลือกหลังรับชำระ ปุ่มหลักคือพิมพ์ใบเสร็จและปิดโต๊ะ เพราะเป็นขั้นตอนที่ทำบ่อยที่สุด */
export function FinishActions({ onFinish, autoFocus }: FinishActionsProps) {
  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        className="h-14 text-base"
        autoFocus={autoFocus}
        onClick={() => onFinish("print-close")}
      >
        <Printer className="size-5" aria-hidden />
        พิมพ์ใบเสร็จ และปิดโต๊ะ
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => onFinish("print-only")}>
          พิมพ์ ยังไม่ปิดโต๊ะ
        </Button>
        <Button variant="outline" onClick={() => onFinish("close-only")}>
          ปิดโต๊ะเลย ไม่พิมพ์
        </Button>
      </div>
    </div>
  );
}
