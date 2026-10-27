import { Plus, Printer } from "lucide-react";
import { Button } from "@/components/ui";

interface TablesPageHeaderProps {
  onAdd: () => void;
  onPrintAll: () => void;
  canPrint: boolean;
}

export function TablesPageHeader({
  onAdd,
  onPrintAll,
  canPrint,
}: TablesPageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-foreground text-[28px] leading-tight font-semibold">
          โต๊ะและคิวอาร์โค้ด
        </h1>
        <p className="text-muted-foreground text-[13px]">
          กดเปิดโต๊ะเมื่อลูกค้ามา ลูกค้าจึงสแกน QR ที่ติดโต๊ะแล้วสั่งอาหารได้
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={onPrintAll} disabled={!canPrint}>
          <Printer className="size-[18px]" aria-hidden />
          พิมพ์ QR ทั้งหมด
        </Button>
        <Button onClick={onAdd}>
          <Plus className="size-[18px]" aria-hidden />
          เพิ่มโต๊ะ
        </Button>
      </div>
    </div>
  );
}
