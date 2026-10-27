import { Copy } from "lucide-react";
import { Button, Switch } from "@/components/ui";
import { cn } from "@/lib/cn";
import { WEEKDAY_NAMES } from "../data/settings";
import type { DayHours, SettingsErrors, ShopSettings } from "../types";
import { SettingsSection } from "./settings-section";

const TIME_INPUT =
  "border-border bg-surface focus-visible:ring-primary/50 h-10 w-[104px] rounded-lg border px-2.5 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40";

interface HoursSectionProps {
  values: ShopSettings;
  errors: SettingsErrors;
  onChange: (patch: Partial<ShopSettings>) => void;
}

/** เวลาเปิด-ปิดรายวัน ปิดวันหยุดได้ และคัดลอกเวลาของวันจันทร์ไปทุกวันได้ในคลิกเดียว */
export function HoursSection({ values, errors, onChange }: HoursSectionProps) {
  function update(index: number, patch: Partial<DayHours>) {
    onChange({
      hours: values.hours.map((day, i) =>
        i === index ? { ...day, ...patch } : day,
      ),
    });
  }

  function copyFromMonday() {
    const monday = values.hours[0];
    onChange({ hours: values.hours.map(() => ({ ...monday })) });
  }

  return (
    <SettingsSection
      id="hours"
      title="เวลาเปิด-ปิดร้าน"
      description="ลูกค้าสั่งอาหารได้เฉพาะช่วงที่ร้านเปิด"
    >
      <ul className="flex flex-col">
        {values.hours.map((day, index) => {
          const error = errors.hours[index];
          return (
            <li
              key={WEEKDAY_NAMES[index]}
              className="border-border flex flex-wrap items-center gap-x-4 gap-y-2 border-b py-3 first:pt-0 last:border-b-0"
            >
              <div className="flex w-36 items-center gap-3">
                <Switch
                  checked={day.open}
                  onCheckedChange={(open) => update(index, { open })}
                  aria-label={`เปิดร้านวัน${WEEKDAY_NAMES[index]}`}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    day.open ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {WEEKDAY_NAMES[index]}
                </span>
              </div>

              {day.open ? (
                <div className="flex items-center gap-2.5">
                  <input
                    type="time"
                    aria-label={`เวลาเปิดวัน${WEEKDAY_NAMES[index]}`}
                    value={day.from}
                    onChange={(e) => update(index, { from: e.target.value })}
                    className={TIME_INPUT}
                  />
                  <span className="text-muted-foreground text-sm">ถึง</span>
                  <input
                    type="time"
                    aria-label={`เวลาปิดวัน${WEEKDAY_NAMES[index]}`}
                    value={day.to}
                    onChange={(e) => update(index, { to: e.target.value })}
                    aria-invalid={!!error || undefined}
                    className={cn(TIME_INPUT, error && "border-danger")}
                  />
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">ร้านหยุด</span>
              )}

              {error && (
                <p
                  role="alert"
                  className="text-danger basis-full text-xs sm:basis-auto"
                >
                  {error}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <div>
        <Button variant="outline" size="sm" onClick={copyFromMonday}>
          <Copy className="size-4" aria-hidden />
          ใช้เวลาของวันจันทร์กับทุกวัน
        </Button>
      </div>
    </SettingsSection>
  );
}
