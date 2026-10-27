import type { ReactNode } from "react";
import { Card, Switch } from "@/components/ui";
import { cn } from "@/lib/cn";

interface SettingsSectionProps {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}

/** การ์ดหนึ่งหมวดของหน้าตั้งค่า (id ใช้เป็นจุดเลื่อนถึงจากเมนูหมวด) */
export function SettingsSection({
  id,
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <Card
      id={id}
      aria-labelledby={`${id}-title`}
      className="flex scroll-mt-24 flex-col gap-5 p-[22px] sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <h2
          id={`${id}-title`}
          className="font-display text-foreground text-lg font-semibold"
        >
          {title}
        </h2>
        <p className="text-muted-foreground text-[13px]">{description}</p>
      </div>
      {children}
    </Card>
  );
}

interface ToggleRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

/** แถวสวิตช์พร้อมคำอธิบายผลที่จะเกิดขึ้น */
export function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
  className,
}: ToggleRowProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p id={`${id}-label`} className="text-foreground text-sm font-medium">
          {label}
        </p>
        <p id={`${id}-desc`} className="text-muted-foreground text-xs">
          {description}
        </p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-desc`}
      />
    </div>
  );
}
