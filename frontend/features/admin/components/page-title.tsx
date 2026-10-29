import type { ReactNode } from "react";

/** หัวข้อหน้าของพื้นที่ผู้ดูแลระบบ: ชื่อ + คำอธิบาย และปุ่มหลักทางขวา */
export function PageTitle({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-foreground text-[28px] leading-tight font-semibold">{title}</h1>
        <p className="text-muted-foreground text-[13px]">{description}</p>
      </div>
      {action}
    </div>
  );
}
