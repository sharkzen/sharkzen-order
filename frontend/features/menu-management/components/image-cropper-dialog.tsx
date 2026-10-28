"use client";

import { useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Button, Dialog } from "@/components/ui";
import { cn } from "@/lib/cn";
import { cropToBlob, type PixelCrop } from "@/features/menu-management/lib/crop-image";

const ASPECTS = [
  { value: 1, label: "สี่เหลี่ยมจัตุรัส 1:1" },
  { value: 4 / 3, label: "แนวนอน 4:3" },
  { value: 16 / 9, label: "แนวนอน 16:9" },
];

interface ImageCropperDialogProps {
  /** ไฟล์ที่เลือก (null = ปิด) */
  file: File | null;
  title?: string;
  /** สัดส่วนที่ให้เลือก ถ้ามีตัวเดียวจะล็อกสัดส่วนนั้นและซ่อนปุ่มเลือก */
  aspects?: { value: number; label: string }[];
  /** ด้านยาวสุดของรูปที่ตัดออกมา (พิกเซล) */
  maxSide?: number;
  onConfirm: (cropped: Blob) => void;
  onClose: () => void;
}

/** ตัดรูปก่อนใช้งาน: เลื่อนและซูมให้ได้ส่วนที่ต้องการ เลือกสัดส่วนได้ */
export function ImageCropperDialog({
  file,
  title = "ตัดรูปเมนู",
  aspects = ASPECTS,
  maxSide,
  onConfirm,
  onClose,
}: ImageCropperDialogProps) {
  return (
    <Dialog open={file !== null} title={title} onClose={onClose} className="w-[min(96vw,560px)]">
      {file && (
        <CropperBody file={file} title={title} aspects={aspects} maxSide={maxSide} onConfirm={onConfirm} onClose={onClose} />
      )}
    </Dialog>
  );
}

function CropperBody({
  file,
  title,
  aspects,
  maxSide,
  onConfirm,
  onClose,
}: {
  file: File;
  title: string;
  aspects: { value: number; label: string }[];
  maxSide?: number;
  onConfirm: (cropped: Blob) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState<string>();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(aspects[0].value);
  const [pixels, setPixels] = useState<PixelCrop>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    // สร้างหลัง mount เพื่อให้ revoke ตอนปิดได้ถูกต้อง
    const frame = requestAnimationFrame(() => setUrl(objectUrl));
    return () => {
      cancelAnimationFrame(frame);
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  async function confirm() {
    if (!url || !pixels) return;
    setBusy(true);
    try {
      onConfirm(await cropToBlob(url, pixels, maxSide));
    } catch (e) {
      setError(e instanceof Error ? e.message : "ตัดรูปไม่สำเร็จ");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 p-6">
        <p aria-hidden className="font-display pr-8 text-lg font-semibold">
          {title}
        </p>

        {aspects.length > 1 && (
        <div role="group" aria-label="สัดส่วนรูป" className="bg-muted grid auto-cols-fr grid-flow-col gap-1 rounded-lg p-1">
          {aspects.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={aspect === item.value}
              onClick={() => setAspect(item.value)}
              className={cn(
                "focus-visible:ring-primary/50 h-10 cursor-pointer rounded-md px-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none sm:text-[13px]",
                aspect === item.value ? "bg-surface text-primary-strong shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        )}

        <div className="relative h-[min(52vh,340px)] overflow-hidden rounded-xl bg-slate-900">
          {url && (
            <Cropper
              image={url}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, areaPixels) => setPixels(areaPixels)}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <ZoomOut className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            aria-label="ซูมรูป"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="accent-primary h-2 w-full cursor-pointer"
          />
          <ZoomIn className="text-muted-foreground size-4 shrink-0" aria-hidden />
        </div>
        <p className="text-muted-foreground text-xs">ลากรูปเพื่อเลื่อนตำแหน่ง ใช้แถบหรือเลื่อนลูกกลิ้งเมาส์เพื่อซูม</p>
        {error && (
          <p role="alert" className="text-danger text-xs">
            {error}
          </p>
        )}
      </div>

      <div className="border-border flex justify-end gap-3 border-t px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          ยกเลิก
        </Button>
        <Button type="button" onClick={confirm} loading={busy} disabled={!pixels}>
          ใช้รูปนี้
        </Button>
      </div>
    </div>
  );
}
