"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

const LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** เรียกเมื่อกรอกครบทุกหลัก (รวมกรณีวางรหัสทั้งชุด) */
  onComplete?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}

/** ช่องกรอก OTP 6 หลัก: เลื่อนช่องอัตโนมัติ, ลบย้อนกลับ, วางรหัสทั้งชุดได้ และรองรับ autofill จาก SMS/อีเมล */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const focus = (index: number) =>
    refs.current[Math.min(Math.max(index, 0), LENGTH - 1)]?.focus();

  function commit(next: string, focusIndex: number) {
    onChange(next);
    focus(focusIndex);
    if (next.length === LENGTH) onComplete?.(next);
  }

  function onType(index: number, raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return;
    // autofill / วางหลายตัวลงช่องเดียว
    const next = (value.slice(0, index) + digits).slice(0, LENGTH);
    commit(next, next.length < LENGTH ? next.length : LENGTH - 1);
  }

  function onKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[index]) onChange(value.slice(0, index) + value.slice(index + 1));
      else {
        onChange(value.slice(0, Math.max(0, index - 1)));
        focus(index - 1);
      }
    } else if (e.key === "ArrowLeft") focus(index - 1);
    else if (e.key === "ArrowRight") focus(index + 1);
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (digits) commit(digits, digits.length < LENGTH ? digits.length : LENGTH - 1);
  }

  return (
    <div role="group" aria-label="รหัสยืนยัน 6 หลัก" className="flex justify-between gap-2 sm:gap-3">
      {Array.from({ length: LENGTH }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={value[i] ?? ""}
          onChange={(e) => onType(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          pattern="\d*"
          maxLength={LENGTH}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={i === 0}
          disabled={disabled}
          aria-label={`หลักที่ ${i + 1}`}
          aria-invalid={invalid || undefined}
          className={cn(
            "bg-surface text-foreground h-14 w-full min-w-0 rounded-lg border text-center text-2xl font-semibold transition-colors outline-none",
            "focus:border-primary focus:ring-primary/30 focus:ring-2 disabled:opacity-50",
            invalid ? "border-danger" : value[i] ? "border-primary" : "border-border",
          )}
        />
      ))}
    </div>
  );
}
