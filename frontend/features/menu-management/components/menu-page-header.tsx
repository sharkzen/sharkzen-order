import { Folder, Plus } from "lucide-react";
import { Button } from "@/components/ui";

export function MenuPageHeader() {
  return (
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-foreground text-[28px] leading-tight font-semibold">
          จัดการเมนูอาหาร
        </h1>
        <p className="text-muted-foreground text-[13px]">
          อัปเดตรูป ราคา และความพร้อมขาย ให้ลูกค้าเห็นเมนูที่ถูกต้องเสมอ
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline">
          <Folder className="size-[18px]" aria-hidden />
          จัดการหมวดหมู่
        </Button>
        <Button>
          <Plus className="size-[18px]" aria-hidden />
          เพิ่มเมนูอาหาร
        </Button>
      </div>
    </div>
  );
}
