"use client";

import type { ReactNode } from "react";
import { FlaskConical, Play } from "lucide-react";
import { Button, Dialog, Switch } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ALERT_TONES, TONE_GROUPS, playAlert } from "../lib/sound";
import type { SoundSettings } from "../lib/sound-settings";

interface SoundSettingsDialogProps {
  open: boolean;
  settings: SoundSettings;
  onChange: (patch: Partial<SoundSettings>) => void;
  onClose: () => void;
  /** จำลองออเดอร์ใหม่เข้ามา เพื่อทดสอบเสียงและการแจ้งเตือน */
  onSimulate: () => void;
  /** จำลองหน้าร้านยกเลิกงานของครัว เพื่อทดสอบการแจ้งเตือนและปุ่มรับทราบ */
  onSimulateFrontCancel: () => void;
}

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-foreground text-sm font-semibold">{title}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      {children}
    </div>
  );
}

/** ตั้งค่าเสียงแจ้งเตือนออเดอร์ใหม่: เปิด/ปิด ระดับเสียง เลือกเสียง เล่นซ้ำ และทดสอบ */
export function SoundSettingsDialog({
  open,
  settings,
  onChange,
  onClose,
  onSimulate,
  onSimulateFrontCancel,
}: SoundSettingsDialogProps) {
  const percent = Math.round(settings.volume * 100);

  return (
    <Dialog
      open={open}
      title="ตั้งค่าเสียงแจ้งเตือน"
      onClose={onClose}
      className="w-[min(94vw,560px)]"
    >
      <div className="border-border border-b px-5 pt-5 pr-14 pb-4">
        <p aria-hidden className="font-display text-lg font-semibold">
          ตั้งค่าเสียงแจ้งเตือน
        </p>
        <p className="text-muted-foreground text-xs">
          เสียงนี้จะดังเมื่อมีออเดอร์ใหม่เข้ามา ค่าที่ตั้งจะจำไว้ในเครื่องนี้
        </p>
      </div>

      <div className="flex flex-col gap-5 p-5">
        <Row
          title="เสียงแจ้งเตือนออเดอร์ใหม่"
          description={
            settings.enabled ? "เปิดอยู่" : "ปิดอยู่ (ยังเห็นการ์ดใหม่กะพริบ)"
          }
        >
          <Switch
            checked={settings.enabled}
            onCheckedChange={(enabled) => onChange({ enabled })}
            aria-label="เปิดหรือปิดเสียงแจ้งเตือนออเดอร์ใหม่"
          />
        </Row>

        <div
          className={cn(
            "flex flex-col gap-5",
            !settings.enabled && "pointer-events-none opacity-45",
          )}
          aria-disabled={!settings.enabled}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="sound-volume"
                className="text-foreground text-sm font-semibold"
              >
                ระดับเสียง
              </label>
              <span className="text-muted-foreground text-xs tabular-nums">
                {percent}%
              </span>
            </div>
            <input
              id="sound-volume"
              type="range"
              min={0}
              max={100}
              step={5}
              value={percent}
              onChange={(e) =>
                onChange({ volume: Number(e.target.value) / 100 })
              }
              onPointerUp={() => playAlert(settings.tone, settings.volume)}
              onKeyUp={() => playAlert(settings.tone, settings.volume)}
              className="accent-primary h-2 w-full cursor-pointer"
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-foreground mb-1 text-sm font-semibold">
              เสียงเรียก ({ALERT_TONES.length} แบบ)
            </legend>
            <div className="scroll-thin border-border flex max-h-[230px] flex-col gap-4 overflow-y-auto rounded-lg border p-3">
              {TONE_GROUPS.map((group) => (
                <div key={group.value} className="flex flex-col gap-2">
                  <p className="text-muted-foreground text-xs">
                    <strong className="text-foreground">{group.label}</strong> •{" "}
                    {group.hint}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ALERT_TONES.filter(
                      (tone) => tone.group === group.value,
                    ).map((tone) => (
                      <div key={tone.value} className="relative">
                        <label className="block cursor-pointer">
                          <input
                            type="radio"
                            name="alert-tone"
                            value={tone.value}
                            checked={settings.tone === tone.value}
                            onChange={() => {
                              onChange({ tone: tone.value });
                              playAlert(tone.value, settings.volume);
                            }}
                            className="peer sr-only"
                          />
                          <span
                            className={cn(
                              "border-border flex min-h-[58px] flex-col rounded-lg border py-2 pr-10 pl-3 transition-colors",
                              "peer-checked:border-primary peer-checked:bg-primary-soft",
                              "peer-focus-visible:ring-primary/50 peer-focus-visible:ring-2",
                            )}
                          >
                            <span className="text-foreground text-[13px] font-semibold">
                              {tone.label}
                            </span>
                            <span className="text-muted-foreground text-[11px] leading-snug">
                              {tone.description}
                            </span>
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => playAlert(tone.value, settings.volume)}
                          aria-label={`ทดลองฟังเสียง ${tone.label}`}
                          className="text-primary-strong hover:bg-primary-muted focus-visible:ring-primary/50 absolute top-1/2 right-2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
                        >
                          <Play className="size-3.5" aria-hidden />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <Row
            title="เล่นซ้ำจนกว่าจะรับออเดอร์"
            description="เตือนซ้ำเป็นระยะ ขณะที่ยังมีออเดอร์ใหม่ค้างอยู่"
          >
            <Switch
              checked={settings.repeat}
              onCheckedChange={(repeat) => onChange({ repeat })}
              aria-label="เล่นเสียงซ้ำจนกว่าจะรับออเดอร์ใหม่"
            />
          </Row>
        </div>

        <div className="bg-background flex flex-col gap-3 rounded-lg px-4 py-3">
          <p className="text-foreground text-sm font-semibold">ทดสอบระบบ</p>
          <div className="flex items-center justify-between gap-4">
            <p className="text-muted-foreground text-xs">
              จำลองออเดอร์ใหม่เข้ามา 1 รายการ เพื่อลองเสียงและการแจ้งเตือน
            </p>
            <Button variant="outline" size="sm" onClick={onSimulate}>
              <FlaskConical className="size-4" aria-hidden />
              ออเดอร์ใหม่
            </Button>
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-muted-foreground text-xs">
              จำลองหน้าร้านยกเลิกงานที่กำลังทำอยู่ เพื่อดูการ์ดแจ้งให้ครัวหยุดทำ
            </p>
            <Button variant="outline" size="sm" onClick={onSimulateFrontCancel}>
              <FlaskConical className="size-4" aria-hidden />
              หน้าร้านยกเลิก
            </Button>
          </div>
        </div>
      </div>

      <div className="border-border flex justify-end border-t px-5 py-3.5">
        <Button onClick={onClose}>เสร็จสิ้น</Button>
      </div>
    </Dialog>
  );
}
