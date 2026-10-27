import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui";

interface StaffPageHeaderProps {
  /** ไม่ส่ง = ไม่มีสิทธิ์สร้างบัญชีพนักงาน จะซ่อนปุ่ม */
  onAdd?: () => void;
}

export function StaffPageHeader({ onAdd }: StaffPageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-foreground text-[28px] leading-tight font-semibold">
          พนักงาน
        </h1>
        <p className="text-muted-foreground text-[13px]">
          เจ้าของร้านสร้างบัญชีให้พนักงาน และกำหนดว่าใครเข้าหน้าไหนได้
          ทำอะไรได้บ้าง หากพนักงานลืมรหัสผ่าน
          เจ้าของร้านหรือผู้จัดการรีเซ็ตให้ได้
        </p>
      </div>
      {onAdd && (
        <Button onClick={onAdd}>
          <UserPlus className="size-[18px]" aria-hidden />
          สร้างบัญชีพนักงาน
        </Button>
      )}
    </div>
  );
}
