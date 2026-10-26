import { Download } from "lucide-react";
import { Button } from "@/components/ui";

interface OrdersPageHeaderProps {
  onExport: () => void;
}

export function OrdersPageHeader({ onExport }: OrdersPageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-foreground text-[28px] leading-tight font-semibold">
          จัดการคำสั่งซื้อ
        </h1>
        <p className="text-muted-foreground text-[13px]">
          ติดตามทุกออร์เดอร์ ตั้งแต่รับเข้าครัวจนถึงชำระเงิน
        </p>
      </div>
      <Button variant="outline" onClick={onExport}>
        <Download className="size-[18px]" aria-hidden />
        ส่งออกรายการ
      </Button>
    </div>
  );
}
