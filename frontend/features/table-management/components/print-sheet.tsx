"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { tableLink } from "../lib/table-utils";
import { pageLayout, type PrintSettings } from "../lib/print-settings";
import type { DiningTable } from "../types";
import { QrCard } from "./qr-card";

interface PrintSheetProps {
  tables: DiningTable[];
  settings: PrintSettings;
  onDone: () => void;
}

/**
 * แผ่นพิมพ์ QR ตามที่เจ้าของร้านตั้งไว้ (ขนาดกระดาษ จำนวนป้ายต่อหน้า ขอบ)
 * วางผ่าน portal ที่ body แล้วสั่งพิมพ์ทันที CSS ใน globals.css ซ่อนส่วนอื่นของหน้าตอนพิมพ์
 */
export function PrintSheet({ tables, settings, onDone }: PrintSheetProps) {
  const layout = pageLayout(settings);
  const perPage = layout.cols * layout.rows;
  const pages = Array.from(
    { length: Math.ceil(tables.length / perPage) },
    (_, i) => tables.slice(i * perPage, (i + 1) * perPage),
  );

  useEffect(() => {
    // รอให้ QR และรูปพื้นหลังวาดเสร็จก่อนเปิดหน้าต่างพิมพ์ (window.print รอจนปิดหน้าต่างพิมพ์)
    const id = setTimeout(() => {
      window.print();
      onDone();
    }, 300);
    return () => clearTimeout(id);
  }, [onDone]);

  return createPortal(
    <div
      id="print-root"
      className="hidden print:block"
      style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
    >
      <style>{`@page { size: ${layout.paper.width}mm ${layout.paper.height}mm; margin: ${layout.margin}mm; }`}</style>
      {pages.map((page, index) => (
        <div
          key={index}
          className="grid"
          style={{
            width: `${layout.areaWidth}mm`,
            height: `${layout.areaHeight}mm`,
            gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
            gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
            breakAfter: index < pages.length - 1 ? "page" : "auto",
          }}
        >
          {page.map((table) => (
            <div key={table.id} className="min-h-0 min-w-0 overflow-hidden">
              <QrCard
                table={table}
                link={tableLink(table, window.location.origin)}
                settings={settings}
                aspect={layout.cardWidth / layout.cardHeight}
              />
            </div>
          ))}
        </div>
      ))}
    </div>,
    document.body,
  );
}
