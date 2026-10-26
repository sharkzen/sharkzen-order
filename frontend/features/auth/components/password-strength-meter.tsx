import { cn } from "@/lib/cn";
import { getPasswordStrength } from "../lib/password-strength";

const BAR_TONES = [
  "",
  "bg-danger",
  "bg-warning",
  "bg-primary",
  "bg-success",
] as const;

const LABEL_TONES = [
  "",
  "text-danger-strong",
  "text-warning-strong",
  "text-primary-strong",
  "text-success-strong",
] as const;

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, label } = getPasswordStrength(password);

  return (
    <div
      className="flex items-center gap-3"
      aria-live="polite"
      aria-label={label ? `ความปลอดภัยของรหัสผ่าน: ${label}` : undefined}
    >
      <div className="flex flex-1 gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              step <= score ? BAR_TONES[score] : "bg-border",
            )}
          />
        ))}
      </div>
      <span
        className={cn(
          "w-14 text-right text-xs font-medium",
          LABEL_TONES[score],
        )}
      >
        {label}
      </span>
    </div>
  );
}
