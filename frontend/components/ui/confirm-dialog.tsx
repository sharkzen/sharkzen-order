"use client";

import type { ReactNode } from "react";
import { Button } from "./button";
import { Dialog } from "./dialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** danger = ปุ่มยืนยันสีแดง (ใช้กับการลบ) */
  tone?: "primary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}

/** กล่องยืนยันการกระทำ สร้างบน Dialog กลาง */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "ยกเลิก",
  tone = "primary",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      title={title}
      onClose={onCancel}
      showClose={false}
      className="w-[min(92vw,420px)]"
    >
      <div className="flex flex-col gap-2 p-6">
        <p aria-hidden className="font-display text-lg font-semibold">
          {title}
        </p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <div className="border-border flex justify-end gap-3 border-t px-6 py-4">
        <Button variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          variant={tone === "danger" ? "danger" : "primary"}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
