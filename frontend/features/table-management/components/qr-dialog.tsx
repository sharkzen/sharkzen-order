"use client";

import { Copy, Printer } from "lucide-react";
import { Button, Dialog } from "@/components/ui";
import { notify } from "@/lib/toast";
import { tableLink } from "../lib/table-utils";
import type { DiningTable } from "../types";
import { QrCode } from "./qr-code";

interface QrDialogProps {
  table: DiningTable | null;
  onPrint: (table: DiningTable) => void;
  onClose: () => void;
}

/** ดู QR ของโต๊ะ: QR นี้ติดโต๊ะถาวร ลูกค้าสั่งได้เมื่อพนักงานเปิดโต๊ะแล้วเท่านั้น */
export function QrDialog({ table, onPrint, onClose }: QrDialogProps) {
  async function copy(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      notify.success("คัดลอกลิงก์แล้ว");
    } catch (error) {
      notify.error(error, "คัดลอกไม่สำเร็จ กรุณาลองอีกครั้ง");
    }
  }

  return (
    <Dialog
      open={table !== null}
      title={table ? `QR ${table.name}` : "QR โต๊ะ"}
      onClose={onClose}
      className="w-[min(94vw,380px)]"
    >
      {table && (
        <>
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <p aria-hidden className="font-display text-lg font-semibold">
              {table.name}
            </p>
            <QrCode
              value={tableLink(table, window.location.origin)}
              label={`QR ${table.name}`}
              className="border-border size-52 rounded-xl border bg-white p-2"
            />
            <p className="text-muted-foreground text-xs">
              {table.zone} • QR นี้ติดโต๊ะถาวร ไม่ต้องพิมพ์ใหม่เมื่อเปิดโต๊ะ
            </p>
          </div>
          <div className="border-border flex justify-end gap-3 border-t px-6 py-4">
            <Button
              variant="outline"
              onClick={() => copy(tableLink(table, window.location.origin))}
            >
              <Copy className="size-[18px]" aria-hidden />
              คัดลอกลิงก์
            </Button>
            <Button onClick={() => onPrint(table)}>
              <Printer className="size-[18px]" aria-hidden />
              พิมพ์
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
