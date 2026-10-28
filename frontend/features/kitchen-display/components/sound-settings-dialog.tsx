"use client";

import { useState, type ReactNode } from "react";
import { FlaskConical, Play } from "lucide-react";
import { Button, Dialog, Switch } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  ALERT_TONES,
  TONE_GROUPS,
  playAlert,
  type AlertTone,
} from "@/features/kitchen-display/lib/sound";
import type { SoundSettings } from "@/features/kitchen-display/lib/sound-settings";

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

type EventId = "order" | "cancel";

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

function toneLabel(tone: AlertTone) {
  return ALERT_TONES.find((item) => item.value === tone)?.label ?? "";
}

interface TonePickerProps {
  /** ชื่อกลุ่ม radio ต้องไม่ซ้ำกันในหน้า */
  name: string;
  value: AlertTone;
  volume: number;
  onSelect: (tone: AlertTone) => void;
}

/** รายการเสียงเรียกแบ่งตามกลุ่ม แตะเพื่อเลือก (เล่นเสียงตัวอย่างให้ทันที) หรือกดปุ่มลูกศรเพื่อฟังเฉยๆ */
export function TonePicker({ name, value, volume, onSelect }: TonePickerProps) {
  return (
    <div className="flex flex-col gap-4">
      {TONE_GROUPS.map((group) => (
        <div key={group.value} className="flex flex-col gap-2">
          <p className="text-muted-foreground text-xs">
            <strong className="text-foreground">{group.label}</strong> •{" "}
            {group.hint}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {ALERT_TONES.filter((tone) => tone.group === group.value).map(
              (tone) => (
                <div key={tone.value} className="relative">
                  <label className="block cursor-pointer">
                    <input
                      type="radio"
                      name={name}
                      value={tone.value}
                      checked={value === tone.value}
                      onChange={() => {
                        onSelect(tone.value);
                        playAlert(tone.value, volume);
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
                    onClick={() => playAlert(tone.value, volume)}
                    aria-label={`ทดลองฟังเสียง ${tone.label}`}
                    className="text-primary-strong hover:bg-primary-muted focus-visible:ring-primary/50 absolute top-1/2 right-2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <Play className="size-3.5" aria-hidden />
                  </button>
                </div>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * ตั้งค่าเสียงแจ้งเตือนของหน้าจอครัว
 * เปิด/ปิดรวมและระดับเสียงใช้ร่วมกัน ส่วนเสียงเรียกตั้งแยกตามเหตุการณ์
 * (ออเดอร์ใหม่ / หน้าร้านยกเลิก) ครัวจึงแยกออกด้วยหูโดยไม่ต้องมองจอ
 */
export function SoundSettingsDialog({
  open,
  settings,
  onChange,
  onClose,
  onSimulate,
  onSimulateFrontCancel,
}: SoundSettingsDialogProps) {
  const [event, setEvent] = useState<EventId>("order");
  const percent = Math.round(settings.volume * 100);

  const events: { id: EventId; title: string; tone: AlertTone }[] = [
    { id: "order", title: "ออเดอร์ใหม่", tone: settings.tone },
    { id: "cancel", title: "หน้าร้านยกเลิก", tone: settings.cancelTone },
  ];

  return (
    <Dialog
      open={open}
      title="ตั้งค่าเสียงแจ้งเตือน"
      onClose={onClose}
      // หัว / เนื้อหาที่เลื่อนได้ / ท้าย: แถบเลื่อนเดียว ปุ่มเสร็จสิ้นอยู่ในจอเสมอ
      className="h-[min(92dvh,780px)] w-[min(94vw,560px)] flex-col overflow-hidden open:flex"
    >
      <div className="border-border shrink-0 border-b px-5 pt-5 pr-14 pb-4">
        <p aria-hidden className="font-display text-lg font-semibold">
          ตั้งค่าเสียงแจ้งเตือน
        </p>
        <p className="text-muted-foreground text-xs">
          ตั้งเสียงแยกตามเหตุการณ์ได้ ค่าที่ตั้งจะจำไว้ในเครื่องนี้
        </p>
      </div>

      <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5">
        <Row
          title="เสียงแจ้งเตือน"
          description={
            settings.enabled ? "เปิดอยู่" : "ปิดอยู่ (ยังเห็นการ์ดใหม่กะพริบ)"
          }
        >
          <Switch
            checked={settings.enabled}
            onCheckedChange={(enabled) => onChange({ enabled })}
            aria-label="เปิดหรือปิดเสียงแจ้งเตือนทั้งหมด"
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
              onPointerUp={() =>
                playAlert(
                  event === "order" ? settings.tone : settings.cancelTone,
                  settings.volume,
                )
              }
              className="accent-primary h-2 w-full cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-foreground text-sm font-semibold">
              เสียงตามเหตุการณ์
            </p>
            <div
              role="radiogroup"
              aria-label="เลือกเหตุการณ์ที่จะตั้งเสียง"
              className="grid grid-cols-2 gap-2"
            >
              {events.map((item) => {
                const active = item.id === event;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setEvent(item.id)}
                    className={cn(
                      "focus-visible:ring-primary/50 flex cursor-pointer flex-col rounded-lg border px-3.5 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none",
                      active
                        ? "border-primary bg-primary-soft"
                        : "border-border hover:bg-background",
                    )}
                  >
                    <span className="text-foreground text-sm font-semibold">
                      {item.title}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {item.id === "cancel" && !settings.cancelEnabled
                        ? "ปิดเสียง"
                        : `เสียง: ${toneLabel(item.tone)}`}
                    </span>
                  </button>
                );
              })}
            </div>

            {event === "order" ? (
              <>
                <p className="text-muted-foreground text-xs">
                  ดังเมื่อมีออเดอร์ใหม่เข้ามา
                </p>
                <TonePicker
                  name="tone-order"
                  value={settings.tone}
                  volume={settings.volume}
                  onSelect={(tone) => onChange({ tone })}
                />
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
              </>
            ) : (
              <>
                <Row
                  title="เสียงเมื่อหน้าร้านยกเลิก"
                  description="ดังครั้งเดียวเมื่อมีงานที่ต้องหยุดทำ แนะนำให้เลือกเสียงที่ต่างจากออเดอร์ใหม่"
                >
                  <Switch
                    checked={settings.cancelEnabled}
                    onCheckedChange={(cancelEnabled) =>
                      onChange({ cancelEnabled })
                    }
                    aria-label="เปิดหรือปิดเสียงเมื่อหน้าร้านยกเลิก"
                  />
                </Row>
                <div
                  className={cn(
                    !settings.cancelEnabled && "pointer-events-none opacity-45",
                  )}
                >
                  <TonePicker
                    name="tone-cancel"
                    value={settings.cancelTone}
                    volume={settings.volume}
                    onSelect={(cancelTone) => onChange({ cancelTone })}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-background flex flex-col gap-3 rounded-lg px-4 py-3">
          <p className="text-foreground text-sm font-semibold">ทดสอบเสียง</p>
          <div className="flex items-center justify-between gap-4">
            <p className="text-muted-foreground text-xs">
              ฟังเสียงเมื่อมีออเดอร์ใหม่ “{toneLabel(settings.tone)}”
            </p>
            <Button variant="outline" size="sm" onClick={onSimulate}>
              <FlaskConical className="size-4" aria-hidden />
              ทดสอบเสียง
            </Button>
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-muted-foreground text-xs">
              ฟังเสียงเมื่อหน้าร้านยกเลิกงาน
              {settings.cancelEnabled
                ? ` “${toneLabel(settings.cancelTone)}”`
                : " (ปิดเสียงอยู่)"}
            </p>
            <Button variant="outline" size="sm" onClick={onSimulateFrontCancel}>
              <FlaskConical className="size-4" aria-hidden />
              ทดสอบเสียง
            </Button>
          </div>
        </div>
      </div>

      <div className="border-border flex shrink-0 justify-end border-t px-5 py-3.5">
        <Button onClick={onClose}>เสร็จสิ้น</Button>
      </div>
    </Dialog>
  );
}
