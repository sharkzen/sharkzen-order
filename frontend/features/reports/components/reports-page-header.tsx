import { Download } from "lucide-react";
import { Button } from "@/components/ui";

interface ReportsPageHeaderProps {
  onExport: () => void;
}

export function ReportsPageHeader({ onExport }: ReportsPageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-foreground text-[28px] leading-tight font-semibold">
          รายงานยอดขาย
        </h1>
        <p className="text-muted-foreground text-[13px]">
          ดูว่าร้านขายดีวันไหน ช่วงเวลาไหน และเมนูอะไรทำเงินที่สุด
        </p>
      </div>
      <Button variant="outline" onClick={onExport}>
        <Download className="size-[18px]" aria-hidden />
        ส่งออกยอดขาย
      </Button>
    </div>
  );
}
