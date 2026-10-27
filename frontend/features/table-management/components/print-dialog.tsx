"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { Button, Dialog } from "@/components/ui";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  pageLayout,
  saveSettings,
  type PrintSettings,
} from "../lib/print-settings";
import { tableLink } from "../lib/table-utils";
import type { DiningTable } from "../types";
import { PrintControls } from "./print-controls";
import { QrCard } from "./qr-card";

interface PrintDialogProps {
  /** โต๊ะที่จะพิมพ์ (null = ปิดอยู่) */
  tables: DiningTable[] | null;
  onPrint: (tables: DiningTable[], settings: PrintSettings) => void;
  onClose: () => void;
}

export function PrintDialog({ tables, onPrint, onClose }: PrintDialogProps) {
  return (
    <Dialog
      open={tables !== null}
      title="พิมพ์ QR โต๊ะ"
      onClose={onClose}
      className="w-[min(96vw,980px)]"
    >
      {tables && (
        <PrintDesigner tables={tables} onPrint={onPrint} onClose={onClose} />
      )}
    </Dialog>
  );
}

/** mount ใหม่ทุกครั้งที่เปิด จึงอ่านค่าที่จำไว้ล่าสุดจากเครื่องนี้ และบันทึกทุกครั้งที่ปรับ */
function PrintDesigner({
  tables,
  onPrint,
  onClose,
}: {
  tables: DiningTable[];
  onPrint: PrintDialogProps["onPrint"];
  onClose: () => void;
}) {
  const [settings, setSettings] = useState(loadSettings);
  const layout = pageLayout(settings);
  const perPage = layout.cols * layout.rows;
  const pages = Math.ceil(tables.length / perPage);
  const sample = tables[0];
  const round = (n: number) => Math.round(n * 10) / 10;

  useEffect(() => saveSettings(settings), [settings]);

  return (
    <>
      <div className="flex flex-col gap-1 px-6 pt-6 pr-14">
        <p aria-hidden className="font-display text-lg font-semibold">
          พิมพ์ QR โต๊ะ
        </p>
        <p className="text-muted-foreground text-xs">
          ตกแต่งป้ายให้เข้ากับร้าน และปรับขนาดให้ตรงกับเครื่องพิมพ์ของคุณ
          ค่าที่ตั้งไว้จะถูกจำไว้ในเครื่องนี้
        </p>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="order-2 lg:order-1">
          <PrintControls
            settings={settings}
            onChange={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
            onReset={() => setSettings(DEFAULT_SETTINGS)}
          />
        </div>

        <div className="order-1 lg:sticky lg:top-0 lg:order-2 lg:self-start">
          <div className="bg-muted flex flex-col items-center gap-3 rounded-xl p-4">
            <div
              className="shadow-float w-full max-w-[300px] bg-white"
              style={{
                aspectRatio: `${layout.cardWidth} / ${layout.cardHeight}`,
              }}
            >
              <QrCard
                table={sample}
                link={tableLink(sample, window.location.origin)}
                settings={settings}
                aspect={layout.cardWidth / layout.cardHeight}
              />
            </div>
            <p className="text-muted-foreground text-center text-xs">
              ตัวอย่างป้ายหนึ่งใบ ขนาด {round(layout.cardWidth)} ×{" "}
              {round(layout.cardHeight)} มม.
              <br />
              {tables.length} ป้าย • {perPage} ป้ายต่อหน้า • {pages} หน้า
            </p>
          </div>
        </div>
      </div>

      <div className="border-border flex justify-end gap-3 border-t px-6 py-4">
        <Button variant="outline" onClick={onClose}>
          ยกเลิก
        </Button>
        <Button onClick={() => onPrint(tables, settings)}>
          <Printer className="size-[18px]" aria-hidden />
          พิมพ์ {tables.length} โต๊ะ
        </Button>
      </div>
    </>
  );
}
