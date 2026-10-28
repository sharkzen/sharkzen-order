"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Crop, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { ImageCropperDialog } from "@/features/menu-management/components/image-cropper-dialog";
import type { PendingImage } from "@/features/menu-management/components/image-picker";

/** สัดส่วนรูปปกที่หน้าสั่งอาหารใช้ (กว้าง 5 : สูง 2) ตัดให้พอดีเพื่อไม่ให้ภาพถูกครอบซ้ำ */
export const COVER_ASPECT = 5 / 2;
const COVER_MAX_SIDE = 1920;
const ASPECTS = [{ value: COVER_ASPECT, label: "รูปปกร้าน 5:2" }];

interface CoverImageFieldProps {
  /** URL รูปที่บันทึกไว้แล้ว ("" = ไม่มี) */
  current: string;
  pending: PendingImage | null;
  onPendingChange: (pending: PendingImage | null) => void;
  /** เอารูปปกออก (ล้างทั้งรูปที่บันทึกไว้และรูปที่เพิ่งเลือก) */
  onRemove: () => void;
}

/** รูปปกร้าน: เลือกรูป → ตัดตามสัดส่วนที่หน้าลูกค้าใช้ → ตัวอย่าง (อัปโหลดตอนกดบันทึก) */
export function CoverImageField({ current, pending, onPendingChange, onRemove }: CoverImageFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>();
  const src = pending?.preview ?? current;

  // คืนหน่วยความจำของตัวอย่างรูปเมื่อเปลี่ยนรูปหรือออกจากหน้า
  const last = useRef<string>(undefined);
  useEffect(() => {
    const previous = last.current;
    last.current = pending?.preview;
    if (previous && previous !== pending?.preview) URL.revokeObjectURL(previous);
  }, [pending]);
  useEffect(
    () => () => {
      if (last.current) URL.revokeObjectURL(last.current);
    },
    [],
  );

  function pick(selected: File | undefined) {
    if (!selected) return;
    if (!/^image\/(jpeg|png|webp)$/.test(selected.type)) return setError("ใช้ไฟล์ JPG, PNG หรือ WebP เท่านั้น");
    if (selected.size > 15 * 1024 * 1024) return setError("รูปใหญ่เกิน 15 MB");
    setError(undefined);
    setFile(selected);
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-foreground text-sm font-semibold">รูปปกร้าน</p>
        <p className="text-muted-foreground text-xs">แสดงด้านบนของหน้าสั่งอาหาร แนะนำรูปแนวนอนที่เห็นบรรยากาศร้านหรืออาหารเด่น</p>
      </div>

      <div className="border-border bg-muted relative aspect-[5/2] w-full max-w-xl overflow-hidden rounded-xl border">
        {src ? (
          <Image src={src} alt="ตัวอย่างรูปปกร้าน" fill unoptimized sizes="576px" className="object-cover" />
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="text-muted-foreground hover:text-primary-strong hover:bg-primary-soft focus-visible:ring-primary/50 flex size-full cursor-pointer flex-col items-center justify-center gap-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <ImagePlus className="size-7" aria-hidden />
            เพิ่มรูปปกร้าน
          </button>
        )}
        {pending && (
          <span className="bg-primary text-primary-foreground absolute top-2 left-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
            รูปใหม่ ยังไม่บันทึก
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {src && (
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>
              <Crop className="size-4" aria-hidden />
              เปลี่ยนรูป
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onRemove}>
              <Trash2 className="size-4" aria-hidden />
              เอาออก
            </Button>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      )}

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label="เลือกรูปปกร้าน"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <ImageCropperDialog
        file={file}
        title="ตัดรูปปกร้าน"
        aspects={ASPECTS}
        maxSide={COVER_MAX_SIDE}
        onClose={() => setFile(null)}
        onConfirm={(blob) => {
          onPendingChange({ blob, preview: URL.createObjectURL(blob) });
          setFile(null);
        }}
      />
    </div>
  );
}
