import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SkeletonProps {
  className?: string;
  children: ReactNode;
}

/**
 * ครอบคอมโพเนนต์จริงที่ใส่ข้อมูลตัวอย่างไว้ ให้กลายเป็น skeleton ที่โครงตรงกับของจริง
 * (สไตล์อยู่ใน globals.css ที่คลาส .sk) ไม่ต้องเขียน skeleton แยกซ้ำ
 */
export function Skeleton({ className, children }: SkeletonProps) {
  return (
    <div role="status" aria-busy="true" aria-label="กำลังโหลด" className={cn("sk", className)}>
      <div aria-hidden>{children}</div>
    </div>
  );
}
