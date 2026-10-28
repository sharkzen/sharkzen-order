"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { fieldBase } from "./input";

const MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];
const MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];
const WEEKDAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const BE_OFFSET = 543;
const MENU_WIDTH = 292;
const MENU_GAP = 6;
const VIEWPORT_MARGIN = 12;

interface Ymd {
  y: number;
  m: number;
  d: number;
}

const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const monthKey = (y: number, m: number) => `${y}-${pad(m)}`;
const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const weekdayOf = (y: number, m: number, d: number) =>
  new Date(Date.UTC(y, m - 1, d)).getUTCDay();

function parse(value: string): Ymd | null {
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value);
  if (!match) return null;
  return { y: +match[1], m: +match[2], d: match[3] ? +match[3] : 1 };
}

function addDays(date: Ymd, n: number): Ymd {
  const t = new Date(Date.UTC(date.y, date.m - 1, date.d + n));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

function addMonths(date: Ymd, n: number): Ymd {
  const total = date.y * 12 + date.m - 1 + n;
  const y = Math.floor(total / 12);
  const m = total - y * 12 + 1;
  return { y, m, d: Math.min(date.d, daysIn(y, m)) };
}

function todayYmd(): Ymd {
  const iso = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(
    new Date(),
  );
  return parse(iso) as Ymd;
}

/** วันที่แบบไทย พ.ศ. เช่น 15 ม.ค. 2569 หรือ มกราคม 2569 */
function formatDisplay(value: string, mode: "day" | "month") {
  const p = parse(value);
  if (!p) return "";
  return mode === "day"
    ? `${p.d} ${MONTHS_SHORT[p.m - 1]} ${p.y + BE_OFFSET}`
    : `${MONTHS[p.m - 1]} ${p.y + BE_OFFSET}`;
}

export interface DatePickerProps {
  /** day = เลือกวัน (ค่า YYYY-MM-DD), month = เลือกเดือน (ค่า YYYY-MM) */
  mode?: "day" | "month";
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  id?: string;
  className?: string;
  size?: "md" | "lg";
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
}

/**
 * ช่องเลือกวันที่/เดือนแบบไทย (ปฏิทินแสดงปี พ.ศ. สัปดาห์เริ่มวันอาทิตย์)
 * ค่าที่ส่งออกยังเป็น ค.ศ. แบบ ISO เหมือน input วันที่ของเบราว์เซอร์
 */
export function DatePicker({
  mode = "day",
  value,
  onChange,
  min,
  max,
  id,
  className,
  size = "md",
  placeholder,
  invalid,
  disabled,
  "aria-label": ariaLabel,
}: DatePickerProps) {
  const autoId = useId();
  const triggerId = id ?? `${autoId}-trigger`;
  const menuId = `${autoId}-menu`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<"days" | "months">("days");
  const [view, setView] = useState({ y: 2000, m: 1 });
  const [focus, setFocus] = useState<Ymd>({ y: 2000, m: 1, d: 1 });
  const [pos, setPos] = useState<CSSProperties | null>(null);

  const selected = parse(value);
  const today = todayYmd();
  const isMonthMode = mode === "month";

  const inRange = (key: string) =>
    (!min || key >= min.slice(0, key.length)) &&
    (!max || key <= max.slice(0, key.length));

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(r.left, window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN),
    );
    const below = window.innerHeight - r.bottom - MENU_GAP - VIEWPORT_MARGIN;
    const above = r.top - MENU_GAP - VIEWPORT_MARGIN;
    const flip = below < 360 && above > below;
    setPos({
      left,
      ...(flip
        ? { bottom: window.innerHeight - r.top + MENU_GAP }
        : { top: r.bottom + MENU_GAP }),
    });
  }, []);

  const openMenu = () => {
    if (disabled) return;
    const base = selected ?? today;
    setView({ y: base.y, m: base.m });
    setFocus(base);
    setLevel(isMonthMode ? "months" : "days");
    place();
    setOpen(true);
  };

  const close = useCallback((refocus = false) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    if (menu && !menu.matches(":popover-open")) menu.showPopover?.();
    const reposition = () => place();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, close]);

  // ย้ายโฟกัสไปที่วัน/เดือนที่เลือกอยู่ เพื่อให้ใช้ลูกศรต่อได้ทันที
  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[data-focus="true"]')?.focus();
  }, [open, level, focus, view.y]);

  function commitDay(d: Ymd) {
    const key = dayKey(d.y, d.m, d.d);
    if (!inRange(key)) return;
    onChange(key);
    close(true);
  }

  function commitMonth(y: number, m: number) {
    if (!inRange(monthKey(y, m))) return;
    if (isMonthMode) {
      onChange(monthKey(y, m));
      close(true);
    } else {
      setView({ y, m });
      setFocus((f) => ({ y, m, d: Math.min(f.d, daysIn(y, m)) }));
      setLevel("days");
    }
  }

  function shift(delta: number) {
    if (level === "months") {
      setView((v) => ({ ...v, y: v.y + delta }));
      return;
    }
    const next = addMonths({ ...view, d: 1 }, delta);
    setView({ y: next.y, m: next.m });
    setFocus((f) => addMonths(f, delta));
  }

  const keyOf = (d: Ymd) => dayKey(d.y, d.m, d.d);
  const prevBlocked =
    level === "months"
      ? !inRange(monthKey(view.y - 1, 12))
      : !inRange(keyOf(addDays({ ...view, d: 1 }, -1)));
  const nextBlocked =
    level === "months"
      ? !inRange(monthKey(view.y + 1, 1))
      : !inRange(keyOf(addMonths({ ...view, d: 1 }, 1)));

  function onGridKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const step: Record<string, () => Ymd> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      PageUp: () => addMonths(focus, -1),
      PageDown: () => addMonths(focus, 1),
    };
    const move = step[e.key];
    if (!move) return;
    e.preventDefault();
    const next = move();
    setView({ y: next.y, m: next.m });
    setFocus(next);
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key === "Escape" && open) {
      // กัน Esc ไปปิด Dialog ที่ครอบอยู่
      e.preventDefault();
      e.stopPropagation();
      close(true);
    } else if (e.key === "Tab" && open && e.currentTarget === triggerRef.current) {
      close();
    }
  }

  const firstWeekday = weekdayOf(view.y, view.m, 1);
  const dayCount = daysIn(view.y, view.m);
  const todayKey = dayKey(today.y, today.m, today.d);
  const todayAllowed = isMonthMode
    ? inRange(monthKey(today.y, today.m))
    : inRange(todayKey);
  const display = formatDisplay(value, mode);

  const navButton =
    "text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-primary/50 flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-invalid={invalid || undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onKeyDown}
        className={cn(
          fieldBase,
          "flex cursor-pointer items-center pr-10 text-left",
          size === "lg" ? "h-[46px]" : "h-10",
          invalid
            ? "border-danger"
            : open
              ? "border-primary"
              : "border-border hover:border-primary/50",
          className,
        )}
      >
        {display ? (
          <span className="truncate">{display}</span>
        ) : (
          <span className="text-muted-foreground truncate">
            {placeholder ?? (isMonthMode ? "เลือกเดือน" : "เลือกวันที่")}
          </span>
        )}
      </button>
      <CalendarDays
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2"
        aria-hidden
      />

      {open && pos && (
        <div
          ref={menuRef}
          id={menuId}
          role="dialog"
          aria-label={isMonthMode ? "เลือกเดือน" : "เลือกวันที่"}
          popover="manual"
          data-select-menu
          onKeyDown={onKeyDown}
          style={{ position: "fixed", inset: "auto", margin: 0, width: MENU_WIDTH, ...pos }}
          className="border-border bg-surface text-foreground shadow-float flex flex-col gap-2 rounded-xl border p-3"
        >
          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => shift(-1)}
              disabled={prevBlocked}
              aria-label={level === "months" ? "ปีก่อนหน้า" : "เดือนก่อนหน้า"}
              className={navButton}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            {level === "days" ? (
              <button
                type="button"
                onClick={() => setLevel("months")}
                className="hover:bg-muted focus-visible:ring-primary/50 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                {MONTHS[view.m - 1]} {view.y + BE_OFFSET}
              </button>
            ) : (
              <p className="px-3 py-1.5 text-sm font-semibold" aria-live="polite">
                {view.y + BE_OFFSET}
              </p>
            )}
            <button
              type="button"
              onClick={() => shift(1)}
              disabled={nextBlocked}
              aria-label={level === "months" ? "ปีถัดไป" : "เดือนถัดไป"}
              className={navButton}
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>

          {level === "days" ? (
            <div onKeyDown={onGridKeyDown}>
              <div className="text-muted-foreground mb-1 grid grid-cols-7 text-center text-xs">
                {WEEKDAYS.map((w) => (
                  <span key={w} className="py-1.5">
                    {w}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-0.5">
                {Array.from({ length: firstWeekday }, (_, i) => (
                  <span key={`blank-${i}`} aria-hidden />
                ))}
                {Array.from({ length: dayCount }, (_, i) => {
                  const d = i + 1;
                  const key = dayKey(view.y, view.m, d);
                  const isSelected = value === key;
                  const disabledDay = !inRange(key);
                  const isFocus = focus.y === view.y && focus.m === view.m && focus.d === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      tabIndex={isFocus ? 0 : -1}
                      data-focus={isFocus || undefined}
                      aria-pressed={isSelected}
                      aria-disabled={disabledDay || undefined}
                      aria-current={key === todayKey ? "date" : undefined}
                      aria-label={`${d} ${MONTHS[view.m - 1]} ${view.y + BE_OFFSET}`}
                      onClick={() => commitDay({ y: view.y, m: view.m, d })}
                      className={cn(
                        "focus-visible:ring-primary/50 mx-auto flex size-9 cursor-pointer items-center justify-center rounded-lg text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
                        isSelected
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "hover:bg-muted",
                        !isSelected &&
                          key === todayKey &&
                          "ring-primary/60 text-primary-strong font-semibold ring-1",
                        disabledDay &&
                          "text-muted-foreground cursor-not-allowed opacity-40 hover:bg-transparent",
                      )}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {MONTHS_SHORT.map((label, i) => {
                const m = i + 1;
                const key = monthKey(view.y, m);
                const isSelected = !!selected && selected.y === view.y && selected.m === m;
                const disabledMonth = !inRange(key);
                return (
                  <button
                    key={label}
                    type="button"
                    data-focus={m === view.m || undefined}
                    aria-pressed={isSelected}
                    aria-disabled={disabledMonth || undefined}
                    aria-label={`${MONTHS[i]} ${view.y + BE_OFFSET}`}
                    onClick={() => commitMonth(view.y, m)}
                    className={cn(
                      "focus-visible:ring-primary/50 h-10 cursor-pointer rounded-lg text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "hover:bg-muted",
                      !isSelected &&
                        today.y === view.y &&
                        today.m === m &&
                        "ring-primary/60 text-primary-strong font-semibold ring-1",
                      disabledMonth &&
                        "text-muted-foreground cursor-not-allowed opacity-40 hover:bg-transparent",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="border-border flex justify-end border-t pt-2">
            <button
              type="button"
              disabled={!todayAllowed}
              onClick={() =>
                isMonthMode ? commitMonth(today.y, today.m) : commitDay(today)
              }
              className="text-primary-strong hover:bg-primary-soft focus-visible:ring-primary/50 h-8 cursor-pointer rounded-lg px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              {isMonthMode ? "เดือนนี้" : "วันนี้"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
