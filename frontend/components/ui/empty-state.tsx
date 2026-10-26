import type { ReactNode } from "react";
import { Button } from "./button";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** แสดงเมื่อไม่มีข้อมูลตรงกับตัวกรอง พร้อมปุ่มทางออก (เช่น ล้างตัวกรอง) */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="bg-background text-muted-foreground flex size-12 items-center justify-center rounded-full">
        {icon}
      </span>
      <p className="text-foreground text-[15px] font-semibold">{title}</p>
      <p className="text-muted-foreground text-[13px]">{description}</p>
      {actionLabel && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
