import { Plus } from "lucide-react";
import { Button } from "@/components/ui";

interface MenuPageHeaderProps {
  onAddItem: () => void;
}

export function MenuPageHeader({ onAddItem }: MenuPageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-foreground text-[28px] leading-tight font-semibold">
          จัดการเมนูอาหาร
        </h1>
        <p className="text-muted-foreground text-[13px]">
          จัดหมวดหมู่และลำดับเมนูด้วยการลาก อัปเดตรูป ราคา และความพร้อมขาย
        </p>
      </div>
      <Button onClick={onAddItem}>
        <Plus className="size-[18px]" aria-hidden />
        เพิ่มเมนูอาหาร
      </Button>
    </div>
  );
}
