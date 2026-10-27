import { cn } from "@/lib/cn";

export type StaffTab = "members" | "roles";

interface StaffTabsProps {
  value: StaffTab;
  memberCount: number;
  roleCount: number;
  onChange: (value: StaffTab) => void;
}

/** สลับระหว่างรายชื่อทีมงาน กับบทบาทและสิทธิ์ */
export function StaffTabs({
  value,
  memberCount,
  roleCount,
  onChange,
}: StaffTabsProps) {
  const tabs: { value: StaffTab; label: string; count: number }[] = [
    { value: "members", label: "ทีมงาน", count: memberCount },
    { value: "roles", label: "บทบาทและสิทธิ์", count: roleCount },
  ];

  return (
    <div
      role="tablist"
      aria-label="มุมมองหน้าพนักงาน"
      className="border-border flex gap-1 border-b"
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            id={`staff-tab-${tab.value}`}
            aria-selected={active}
            aria-controls={`staff-panel-${tab.value}`}
            onClick={() => onChange(tab.value)}
            className={cn(
              "focus-visible:ring-primary/50 -mb-px flex h-11 cursor-pointer items-center gap-2 border-b-2 px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
              active
                ? "border-primary text-primary-strong"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "rounded-[5px] px-1.5 py-px text-[11px]",
                active ? "bg-primary-soft" : "bg-background",
              )}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
