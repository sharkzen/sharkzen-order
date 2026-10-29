import Link from "next/link";
import { UserPlus } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui";

interface StaffPageHeaderProps {
  /** รหัสร้านสำหรับให้พนักงานกรอกตอนเข้าสู่ระบบ */
  shopCode: string;
  /** ไม่ส่ง = ไม่มีสิทธิ์สร้างบัญชีพนักงาน จะซ่อนปุ่ม */
  onAdd?: () => void;
}

export function StaffPageHeader({ shopCode, onAdd }: StaffPageHeaderProps) {
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
        <p className="text-muted-foreground mt-1 text-[13px]">
          พนักงานเข้าสู่ระบบที่ <Link href={ROUTES.staffLogin} target="_blank" rel="noopener" className="text-primary-strong font-medium underline-offset-2 hover:underline">/staff-login</Link> ด้วยรหัสร้าน{" "}
          <span className="bg-primary-soft text-primary-strong rounded-md px-2 py-0.5 font-mono font-semibold tracking-widest select-all">
            {shopCode}
          </span>
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
