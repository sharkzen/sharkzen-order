import { cn } from "@/lib/cn";

interface SegmentedProps<T extends string | number> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

/** ตัวเลือกแบบปุ่มเรียงแถว เลือกได้อย่างเดียว (ใช้กับขนาดกระดาษ จำนวนต่อหน้า) */
export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="bg-muted grid auto-cols-fr grid-flow-col gap-1 rounded-lg p-1"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "focus-visible:ring-primary/50 h-8 cursor-pointer rounded-md px-2 text-[13px] font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
              active
                ? "bg-surface text-primary-strong shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
