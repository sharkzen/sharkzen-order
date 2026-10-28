"use client";

import { BellRing, Info } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { TonePicker } from "@/features/kitchen-display/components/sound-settings-dialog";
import { ALERT_TONES, playAlert } from "@/features/kitchen-display/lib/sound";
import { useCallSoundSettings } from "@/features/staff-call/lib/call-sound-settings";
import { notify } from "@/lib/toast";
import { SettingsSection, ToggleRow } from "./settings-section";

/**
 * เสียงเมื่อลูกค้ากดเรียกพนักงาน (ทุกหน้าของร้านจะดังและขึ้นป้ายบอกโต๊ะ)
 * ค่านี้จำไว้ในเครื่องนี้ ไม่ผ่านปุ่มบันทึกของหน้า จึงมีผลทันทีและตั้งแยกตามเครื่องได้
 */
export function StaffCallSection() {
  const [settings, update] = useCallSoundSettings();
  const percent = Math.round(settings.volume * 100);
  const toneLabel = ALERT_TONES.find((t) => t.value === settings.tone)?.label ?? "";

  return (
    <SettingsSection
      id="staff-call"
      title="เสียงเรียกพนักงาน"
      description="เมื่อลูกค้ากดเรียกจากโต๊ะ จะมีเสียงดังและป้ายบอกว่าโต๊ะไหน ไม่ว่าอยู่หน้าไหนของร้าน"
    >
      <div className="flex flex-col gap-5">
        <ToggleRow
          id="staff-call-sound"
          label="เปิดเสียงเรียกพนักงาน"
          description={
            settings.enabled
              ? "เสียงดังทุกครั้งที่ลูกค้าเรียก"
              : "ปิดเสียงอยู่ แต่ยังเห็นป้ายแจ้งโต๊ะที่เรียก"
          }
          checked={settings.enabled}
          onChange={(enabled) => update({ enabled })}
        />

        <div
          className={cn("flex flex-col gap-5", !settings.enabled && "pointer-events-none opacity-45")}
          aria-disabled={!settings.enabled}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="staff-call-volume" className="text-foreground text-sm font-medium">
                ระดับเสียง
              </label>
              <span className="text-muted-foreground text-xs tabular-nums">{percent}%</span>
            </div>
            <input
              id="staff-call-volume"
              type="range"
              min={0}
              max={100}
              step={5}
              value={percent}
              onChange={(e) => update({ volume: Number(e.target.value) / 100 })}
              onPointerUp={() => playAlert(settings.tone, settings.volume)}
              className="accent-primary h-2 w-full cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-foreground text-sm font-medium">เลือกเสียง</p>
            <TonePicker
              name="tone-staff-call"
              value={settings.tone}
              volume={settings.volume}
              onSelect={(tone) => update({ tone })}
            />
          </div>
        </div>

        <div className="bg-background flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3">
          <p className="text-muted-foreground text-xs">
            ทดสอบเสียง{settings.enabled ? ` “${toneLabel}”` : " (ปิดเสียงอยู่)"} พร้อมป้ายแจ้งตัวอย่าง
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              notify.warning("โต๊ะ 1 เรียกพนักงาน", "ชั้น 1 • กรุณาไปที่โต๊ะ");
              if (settings.enabled) playAlert(settings.tone, settings.volume);
            }}
          >
            <BellRing className="size-4" aria-hidden />
            ทดสอบ
          </Button>
        </div>

        <p className="text-muted-foreground flex items-start gap-2 text-xs">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          ตั้งค่านี้จำไว้ในเครื่องนี้เท่านั้น เบราว์เซอร์ต้องมีการแตะหน้าจอหนึ่งครั้งหลังเปิดหน้าก่อนจึงจะเล่นเสียงได้
        </p>
      </div>
    </SettingsSection>
  );
}
