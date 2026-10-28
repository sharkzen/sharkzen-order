"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Crop, ImagePlus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { MENU_IMAGE_SIZE } from "@/features/menu-management/types";
import { ImageCropperDialog } from "./image-cropper-dialog";

/** รูปที่ตัดแล้วแต่ยังไม่อัปโหลด (อัปโหลดตอนกดบันทึก จึงไม่มีรูปค้างบน R2 ถ้ายกเลิก) */
export interface PendingImage {
  blob: Blob;
  preview: string;
}

interface ImagePickerProps {
  /** URL รูปที่บันทึกไว้แล้ว ("" = ไม่มี) */
  current: string;
  pending: PendingImage | null;
  onPendingChange: (pending: PendingImage | null) => void;
  /** กดเอารูปออก (ล้างทั้งรูปที่บันทึกไว้และรูปที่เพิ่งเลือก) */
  onRemove: () => void;
  error?: string;
  size?: "md" | "lg";
  /** แบบกะทัดรัด: ภาพย่อที่กดเพื่อเลือกรูป (ใช้ในแถวเมนูตอนเพิ่มหลายรายการ) */
  compact?: boolean;
  inputId: string;
}

/** เลือกรูป → ตัดรูปตามต้องการ → แสดงตัวอย่าง (ยังไม่อัปโหลดจนกว่าจะกดบันทึก) */
export function ImagePicker({ current, pending, onPendingChange, onRemove, error, size = "md", compact = false, inputId }: ImagePickerProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>();
  const src = pending?.preview ?? current;
  const box = size === "lg" ? "size-[104px]" : "size-[88px]";

  // คืนหน่วยความจำของตัวอย่างรูปเมื่อเปลี่ยนรูปหรือปิดฟอร์ม
  const lastPreview = useRef<string>(undefined);
  useEffect(() => {
    const previous = lastPreview.current;
    lastPreview.current = pending?.preview;
    if (previous && previous !== pending?.preview) URL.revokeObjectURL(previous);
  }, [pending]);
  useEffect(
    () => () => {
      if (lastPreview.current) URL.revokeObjectURL(lastPreview.current);
    },
    [],
  );

  function pick(selected: File | undefined) {
    if (!selected) return;
    if (!/^image\/(jpeg|png|webp)$/.test(selected.type)) {
      setFileError("ใช้ไฟล์ JPG, PNG หรือ WebP เท่านั้น");
      return;
    }
    if (selected.size > 15 * 1024 * 1024) {
      setFileError("รูปใหญ่เกิน 15 MB");
      return;
    }
    setFileError(undefined);
    setFile(selected);
  }

  const cropper = (
    <ImageCropperDialog
      file={file}
      onClose={() => setFile(null)}
      onConfirm={(blob) => {
        onPendingChange({ blob, preview: URL.createObjectURL(blob) });
        setFile(null);
      }}
    />
  );
  const input = (
    <input
      ref={fileInput}
      id={inputId}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="sr-only"
      aria-label="เลือกรูปเมนู"
      onChange={(e) => {
        pick(e.target.files?.[0]);
        e.target.value = "";
      }}
    />
  );

  if (compact) {
    return (
      <div className="flex w-[84px] shrink-0 flex-col items-center gap-1.5">
        <div className="relative">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            aria-label={src ? "เปลี่ยนรูปเมนู" : "เพิ่มรูปเมนู"}
            className="border-border hover:border-primary hover:bg-primary-soft focus-visible:ring-primary/50 group relative flex size-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            {src ? (
              <>
                <Image src={src} alt="ตัวอย่างรูปเมนู" width={84} height={84} unoptimized className="size-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/55 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <Crop className="size-3" aria-hidden />
                  เปลี่ยน
                </span>
              </>
            ) : (
              <span className="text-muted-foreground group-hover:text-primary flex flex-col items-center gap-1 text-[11px]">
                <ImagePlus className="size-6" aria-hidden />
                เพิ่มรูป
              </span>
            )}
          </button>
          {src && (
            <button
              type="button"
              onClick={onRemove}
              aria-label="เอารูปออก"
              className="border-border bg-surface text-muted-foreground hover:text-danger focus-visible:ring-danger/50 absolute -top-2 -right-2 flex size-6 cursor-pointer items-center justify-center rounded-full border shadow-sm focus-visible:ring-2 focus-visible:outline-none"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          )}
        </div>
        {pending && (
          <span className="bg-primary-soft text-primary-strong rounded-full px-2 py-0.5 text-[10px] font-semibold">รูปใหม่</span>
        )}
        {(fileError || error) && (
          <p role="alert" className="text-danger text-center text-[11px] leading-tight">
            {fileError ?? error}
          </p>
        )}
        {input}
        {cropper}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        {src ? (
          <Image
            src={src}
            alt="ตัวอย่างรูปเมนู"
            width={104}
            height={104}
            unoptimized
            className={cn(box, "rounded-xl object-cover")}
          />
        ) : (
          <span
            aria-hidden
            className={cn(
              box,
              "bg-primary-soft text-primary-strong flex flex-col items-center justify-center rounded-xl text-center text-[13px] leading-tight font-semibold",
            )}
          >
            {MENU_IMAGE_SIZE.width} × {MENU_IMAGE_SIZE.height}
            <span className="text-[11px] font-medium opacity-80">px</span>
          </span>
        )}
        {pending && <span className="bg-primary-soft text-primary-strong rounded-full px-2 py-0.5 text-[10px] font-semibold">รูปใหม่</span>}
      </div>

      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap gap-1.5">
          <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
            {src ? <Crop className="size-4" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
            {src ? "เปลี่ยนรูป" : "เพิ่มรูป"}
          </Button>
          {src && (
            <Button type="button" variant="outline" size="sm" onClick={onRemove}>
              <Trash2 className="size-4" aria-hidden />
              เอาออก
            </Button>
          )}
        </div>
        {(fileError || error) && (
          <p role="alert" className="text-danger text-xs">
            {fileError ?? error}
          </p>
        )}
        {input}
      </div>

      {cropper}
    </div>
  );
}
