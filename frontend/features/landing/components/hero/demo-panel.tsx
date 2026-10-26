import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface DemoPanelProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}

/** กรอบมาตรฐานของแต่ละหน้าจอในตัวอย่าง (หน้าจอครัว, บิล) */
export function DemoPanel({ title, icon: Icon, children }: DemoPanelProps) {
  return (
    <div className="border-border bg-surface shadow-card flex min-h-[172px] flex-col gap-3 rounded-xl border p-5">
      <p className="text-muted-foreground flex items-center gap-2 text-[13px] font-medium">
        <Icon className="text-primary size-4" aria-hidden />
        {title}
      </p>
      {children}
    </div>
  );
}
