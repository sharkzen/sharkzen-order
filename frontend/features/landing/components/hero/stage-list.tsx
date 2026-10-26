import { cn } from "@/lib/cn";
import { DEMO_STAGES } from "../../data";

interface StageListProps {
  current: number;
  onSelect: (stage: number) => void;
}

/** ไทม์ไลน์ 5 ขั้นของตัวอย่าง กดเพื่อข้ามไปดูขั้นนั้นได้ */
export function StageList({ current, onSelect }: StageListProps) {
  return (
    <ol className="flex flex-wrap gap-2" aria-label="ขั้นตอนของตัวอย่าง">
      {DEMO_STAGES.map((label, index) => (
        <li key={label}>
          <button
            type="button"
            onClick={() => onSelect(index)}
            aria-current={index === current ? "step" : undefined}
            className={cn(
              "focus-visible:ring-primary/50 cursor-pointer rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
              index === current
                ? "border-primary bg-primary text-primary-foreground"
                : index < current
                  ? "border-primary-muted bg-primary-soft text-primary-strong"
                  : "border-border bg-surface text-muted-foreground hover:bg-muted",
            )}
          >
            {label}
          </button>
        </li>
      ))}
    </ol>
  );
}
