import { cn } from "@/lib/cn";
import { KITCHEN_CANCEL_REASONS } from "../lib/kitchen-utils";

interface ReasonPickerProps {
  value: string;
  onChange: (reason: string) => void;
  /** ชื่อกลุ่มของตัวเลือก (ต้องไม่ซ้ำกับกลุ่มอื่นในหน้า) */
  name: string;
}

/** เลือกเหตุผลที่ครัวยกเลิก (ใช้ทั้งยกเลิกทั้งออเดอร์และยกเลิกรายจาน) */
export function ReasonPicker({ value, onChange, name }: ReasonPickerProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-foreground mb-2 text-sm font-semibold">
        เหตุผลที่ยกเลิก
      </legend>
      {KITCHEN_CANCEL_REASONS.map((reason) => (
        <label key={reason} className="relative cursor-pointer">
          <input
            type="radio"
            name={name}
            value={reason}
            checked={value === reason}
            onChange={() => onChange(reason)}
            className="peer sr-only"
          />
          <span
            className={cn(
              "border-border flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm transition-colors",
              "peer-checked:border-danger peer-checked:bg-danger-soft peer-checked:font-semibold",
              "peer-focus-visible:ring-primary/50 peer-focus-visible:ring-2",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex size-4 items-center justify-center rounded-full border",
                value === reason ? "border-danger" : "border-border",
              )}
            >
              {value === reason && (
                <span className="bg-danger size-2 rounded-full" />
              )}
            </span>
            {reason}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
