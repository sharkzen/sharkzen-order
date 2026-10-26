"use client";

import {
  Maximize,
  Minimize,
  Settings2,
  Volume2,
  VolumeOff,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Badge, Button } from "@/components/ui";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { useOnline } from "@/hooks/use-online";
import { cn } from "@/lib/cn";
import { KITCHEN } from "../data/kitchen-orders";

const DATE_FORMAT = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Bangkok",
});

const TIME_FORMAT = new Intl.DateTimeFormat("th-TH", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Bangkok",
});

const HM_FORMAT = new Intl.DateTimeFormat("th-TH", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Bangkok",
});

export function formatClock(now: Date | null) {
  return now ? TIME_FORMAT.format(now) : "--:--:--";
}

/** เวลา HH:mm ใช้เป็นเวลาที่สั่งของออเดอร์ที่เพิ่งเข้ามา */
export function formatHourMinute(now: Date | null) {
  return now ? HM_FORMAT.format(now).replace(".", ":") : "--:--";
}

interface KitchenHeaderProps {
  now: Date | null;
  soundOn: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
}

/** แถบบนของหน้าจอครัว: ร้าน นาฬิกาสด การเชื่อมต่อ เสียงแจ้งเตือน (เปิด/ปิดและตั้งค่า) และเต็มหน้าจอ */
export function KitchenHeader({
  now,
  soundOn,
  onToggleSound,
  onOpenSettings,
}: KitchenHeaderProps) {
  const online = useOnline();
  const fullscreen = useFullscreen();

  return (
    <header className="border-border bg-surface flex h-16 shrink-0 items-center justify-between gap-6 border-b px-5">
      <div className="flex items-center gap-5">
        <Logo size={32} />
        <div className="flex flex-col leading-[1.5]">
          <span className="text-foreground text-sm font-semibold">
            {KITCHEN.shop}
          </span>
          <span className="text-muted-foreground text-[11px]">
            {KITCHEN.branch}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end leading-[1.4]">
          <time
            dateTime={now?.toISOString()}
            className="font-display text-foreground text-[22px] font-semibold tabular-nums"
          >
            {formatClock(now)} น.
          </time>
          <span className="text-muted-foreground text-[11px]">
            {now ? DATE_FORMAT.format(now) : " "}
          </span>
        </div>

        <Badge tone={online ? "success" : "danger"}>
          {online ? (
            <Wifi className="size-[13px]" aria-hidden />
          ) : (
            <WifiOff className="size-[13px]" aria-hidden />
          )}
          {online ? "เชื่อมต่อแล้ว" : "ขาดการเชื่อมต่อ"}
        </Badge>

        <div className="flex">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleSound}
            aria-pressed={soundOn}
            className={cn(
              "h-10 rounded-r-none border-r-0 px-3.5 text-sm",
              soundOn && "text-primary-strong bg-primary-soft",
            )}
          >
            {soundOn ? (
              <Volume2 className="size-[17px]" aria-hidden />
            ) : (
              <VolumeOff className="size-[17px]" aria-hidden />
            )}
            {soundOn ? "เสียงเปิด" : "เสียงปิด"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSettings}
            aria-label="ตั้งค่าเสียงแจ้งเตือน"
            className="h-10 rounded-l-none px-3"
          >
            <Settings2 className="size-[17px]" aria-hidden />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fullscreen.toggle}
          aria-pressed={fullscreen.active}
          className="h-10 px-3.5 text-sm"
        >
          {fullscreen.active ? (
            <Minimize className="size-[17px]" aria-hidden />
          ) : (
            <Maximize className="size-[17px]" aria-hidden />
          )}
          {fullscreen.active ? "ออกจากเต็มจอ" : "เต็มหน้าจอ"}
        </Button>
      </div>
    </header>
  );
}
