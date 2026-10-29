"use client";

import { useState } from "react";
import { Button, Dialog, FormField, Textarea } from "@/components/ui";

interface ReasonDialogProps {
  open: boolean;
  title: string;
  /** อธิบายผลของการกระทำให้ชัดก่อนกดยืนยัน */
  description: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

/** กล่องยืนยันการแบน/ระงับ พร้อมช่องเหตุผล (เหตุผลจะแสดงให้เจ้าของเห็นในหน้าต่างแจ้งการถูกระงับ) */
export function ReasonDialog({ open, title, description, confirmLabel, onClose, onConfirm }: ReasonDialogProps) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await onConfirm(reason.trim());
      setReason("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      title={title}
      onClose={busy ? () => undefined : onClose}
      showClose={false}
      className="w-[min(94vw,460px)]"
    >
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-1.5">
          <p aria-hidden className="font-display text-lg font-semibold">
            {title}
          </p>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <FormField
          label="เหตุผล (ไม่บังคับ)"
          htmlFor="admin-reason"
          hint="เจ้าของร้านจะเห็นข้อความนี้ในหน้าต่างแจ้งการถูกระงับ"
        >
          <Textarea
            id="admin-reason"
            rows={3}
            maxLength={300}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="เช่น ค้างชำระเกินกำหนด หรือพบการใช้งานผิดเงื่อนไข"
          />
        </FormField>
      </div>
      <div className="border-border flex justify-end gap-3 border-t px-6 py-4">
        <Button variant="outline" onClick={onClose} disabled={busy}>
          ยกเลิก
        </Button>
        <Button variant="danger" loading={busy} onClick={submit}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
