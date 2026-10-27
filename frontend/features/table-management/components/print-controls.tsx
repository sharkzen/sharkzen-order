"use client";

import { useRef, type ReactNode } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button, FormField, Input, Switch } from "@/components/ui";
import { cn } from "@/lib/cn";
import { readImage } from "@/lib/read-image";
import { notify } from "@/lib/toast";
import {
  ACCENTS,
  BACKGROUNDS,
  LOOKS,
  TEXT_COLORS,
  PAPERS,
  PER_PAGE_OPTIONS,
  type PaperId,
  type PerPage,
  type PrintSettings,
} from "../lib/print-settings";
import { Segmented } from "./segmented";

const MAX_IMAGE_MB = 8;

const PAPER_OPTIONS: { value: PaperId; label: string }[] = [
  ...Object.entries(PAPERS).map(([id, p]) => ({
    value: id as PaperId,
    label: p.label,
  })),
  { value: "custom", label: "กำหนดเอง" },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3.5">
      <h3 className="text-foreground text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

function RangeRow({
  id,
  label,
  value,
  unit,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex justify-between text-sm font-medium">
        {label}
        <span className="text-muted-foreground font-normal">
          {value}
          {unit}
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-primary w-full cursor-pointer"
      />
    </div>
  );
}

function ColorPicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex flex-wrap items-center gap-2.5">
        {options.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`${label} ${color}`}
            aria-pressed={value === color}
            onClick={() => onChange(color)}
            style={{ backgroundColor: color }}
            className={cn(
              "border-border focus-visible:ring-primary/50 size-7 cursor-pointer rounded-full border ring-offset-2 focus-visible:ring-2 focus-visible:outline-none",
              value === color && "ring-foreground ring-2",
            )}
          />
        ))}
        <input
          type="color"
          aria-label={`${label} เลือกสีเอง`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border-border size-7 cursor-pointer rounded-full border bg-transparent p-0"
        />
      </div>
    </div>
  );
}

interface PrintControlsProps {
  settings: PrintSettings;
  onChange: (patch: Partial<PrintSettings>) => void;
  onReset: () => void;
}

/** แผงตั้งค่าป้าย QR: ข้อความ รูปแบบ รูปพื้นหลัง และกระดาษ */
export function PrintControls({
  settings,
  onChange,
  onReset,
}: PrintControlsProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function pickImage(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      notify.warning(`ไฟล์ใหญ่เกินไป`, `เลือกรูปที่ไม่เกิน ${MAX_IMAGE_MB} MB`);
      return;
    }
    try {
      onChange({ image: await readImage(file) });
    } catch (error) {
      notify.error(error);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-6">
      <Section title="แบบสำเร็จรูป">
        <div className="flex flex-wrap gap-2">
          {LOOKS.map((look) => (
            <Button
              key={look.id}
              variant="outline"
              size="sm"
              onClick={() => onChange(look.patch)}
            >
              {look.label}
            </Button>
          ))}
        </div>
      </Section>

      <Section title="ขนาด QR และเลขโต๊ะ">
        <RangeRow
          id="print-qr-size"
          label="ขนาด QR"
          value={settings.qrSize}
          unit="%"
          min={40}
          max={80}
          onChange={(qrSize) => onChange({ qrSize })}
        />
        <RangeRow
          id="print-name-size"
          label="ขนาดเลขโต๊ะ"
          value={settings.nameSize}
          unit="%"
          min={60}
          max={140}
          onChange={(nameSize) => onChange({ nameSize })}
        />
        <p className="text-muted-foreground text-xs">
          ถ้าใหญ่จนล้นป้าย ระบบจะย่อให้พอดีอัตโนมัติ
        </p>
      </Section>

      <Section title="ข้อความบนป้าย">
        <FormField
          label="หัวป้าย"
          htmlFor="print-headline"
          hint="เว้นว่างถ้าไม่ต้องการแสดง"
        >
          <Input
            id="print-headline"
            value={settings.headline}
            maxLength={40}
            onChange={(e) => onChange({ headline: e.target.value })}
            placeholder="เช่น สแกนเพื่อสั่งอาหาร"
          />
        </FormField>
        <FormField
          label="ข้อความรอง"
          htmlFor="print-subline"
          hint="เช่น ชื่อร้าน หรือคำแนะนำสั้นๆ (ไม่บังคับ)"
        >
          <Input
            id="print-subline"
            value={settings.subline}
            maxLength={60}
            onChange={(e) => onChange({ subline: e.target.value })}
          />
        </FormField>
        <ToggleRow
          label="แสดงชื่อโต๊ะ"
          checked={settings.showName}
          onChange={(showName) => onChange({ showName })}
        />
        <ToggleRow
          label="แสดงโซน / ชั้น"
          checked={settings.showZone}
          onChange={(showZone) => onChange({ showZone })}
        />
        <RangeRow
          id="print-headline-size"
          label="ขนาดหัวป้าย"
          value={settings.headlineSize}
          unit="%"
          min={60}
          max={140}
          onChange={(headlineSize) => onChange({ headlineSize })}
        />
      </Section>

      <Section title="สี">
        <ColorPicker
          label="สีหลัก (หัวป้ายและกรอบ)"
          value={settings.accent}
          options={ACCENTS}
          onChange={(accent) => onChange({ accent })}
        />
        <ColorPicker
          label="สีพื้นหลังป้าย"
          value={settings.background}
          options={BACKGROUNDS}
          onChange={(background) => onChange({ background })}
        />
        <ColorPicker
          label="สีข้อความ"
          value={settings.textColor}
          options={TEXT_COLORS}
          onChange={(textColor) => onChange({ textColor })}
        />
      </Section>

      <Section title="กรอบและเส้น">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">กรอบรอบป้าย</span>
          <Segmented
            label="กรอบรอบป้าย"
            value={settings.frame}
            options={[
              { value: "none", label: "ไม่มี" },
              { value: "thin", label: "บาง" },
              { value: "thick", label: "หนา" },
            ]}
            onChange={(frame) => onChange({ frame })}
          />
        </div>
        <ToggleRow
          label="มุมป้ายโค้งมน"
          checked={settings.rounded}
          onChange={(rounded) => onChange({ rounded })}
        />
        <ToggleRow
          label="กรอบรอบ QR"
          checked={settings.qrFrame}
          onChange={(qrFrame) => onChange({ qrFrame })}
        />
        <ToggleRow
          label="เส้นประสำหรับตัด"
          checked={settings.showCutLine}
          onChange={(showCutLine) => onChange({ showCutLine })}
        />
      </Section>

      <Section title="รูปพื้นหลัง">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          id="print-image"
          onChange={(e) => pickImage(e.target.files?.[0])}
        />
        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus className="size-4" aria-hidden />
            {settings.image ? "เปลี่ยนรูป" : "เลือกรูป"}
          </Button>
          {settings.image && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange({ image: null })}
            >
              <Trash2 className="size-4" aria-hidden />
              ลบรูป
            </Button>
          )}
        </div>
        {settings.image ? (
          <>
            <RangeRow
              id="print-image-opacity"
              label="ความเข้มของรูป"
              value={settings.imageOpacity}
              unit="%"
              min={10}
              max={100}
              onChange={(imageOpacity) => onChange({ imageOpacity })}
            />
            <ToggleRow
              label="แผ่นรองข้อความ (อ่านง่ายบนรูป)"
              checked={settings.textPlate}
              onChange={(textPlate) => onChange({ textPlate })}
            />
          </>
        ) : (
          <p className="text-muted-foreground text-xs">
            ใส่โลโก้ ลายร้าน หรือภาพบรรยากาศเป็นพื้นหลังได้ QR
            จะอยู่บนกรอบสีขาวเสมอ จึงยังสแกนง่าย
          </p>
        )}
      </Section>

      <Section title="กระดาษและการพิมพ์">
        <Segmented
          label="ขนาดกระดาษ"
          value={settings.paper}
          options={PAPER_OPTIONS}
          onChange={(paper) => onChange({ paper })}
        />
        {settings.paper === "custom" ? (
          <div className="grid grid-cols-2 gap-3">
            <FormField label="กว้าง (มม.)" htmlFor="print-width">
              <Input
                id="print-width"
                type="number"
                inputMode="numeric"
                min={40}
                max={500}
                value={settings.customWidth}
                onChange={(e) =>
                  onChange({ customWidth: Number(e.target.value) })
                }
              />
            </FormField>
            <FormField label="สูง (มม.)" htmlFor="print-height">
              <Input
                id="print-height"
                type="number"
                inputMode="numeric"
                min={40}
                max={500}
                value={settings.customHeight}
                onChange={(e) =>
                  onChange({ customHeight: Number(e.target.value) })
                }
              />
            </FormField>
          </div>
        ) : (
          <Segmented
            label="การวางแนวกระดาษ"
            value={settings.landscape ? "landscape" : "portrait"}
            options={[
              { value: "portrait", label: "แนวตั้ง" },
              { value: "landscape", label: "แนวนอน" },
            ]}
            onChange={(v) => onChange({ landscape: v === "landscape" })}
          />
        )}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">จำนวนป้ายต่อหน้า</span>
          <Segmented<PerPage>
            label="จำนวนป้ายต่อหน้า"
            value={settings.perPage}
            options={PER_PAGE_OPTIONS.map((n) => ({
              value: n,
              label: String(n),
            }))}
            onChange={(perPage) => onChange({ perPage })}
          />
        </div>
        <RangeRow
          id="print-margin"
          label="ขอบกระดาษ"
          value={settings.margin}
          unit=" มม."
          min={0}
          max={20}
          onChange={(margin) => onChange({ margin })}
        />
        <p className="text-muted-foreground text-xs">
          ตอนพิมพ์ให้เลือกขนาดกระดาษในหน้าต่างพิมพ์ให้ตรงกับที่ตั้งไว้
          และเลือกขนาด 100% (ไม่ย่อให้พอดี)
        </p>
      </Section>

      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="self-start"
      >
        คืนค่าเริ่มต้น
      </Button>
    </div>
  );
}
