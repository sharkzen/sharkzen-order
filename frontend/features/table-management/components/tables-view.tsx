"use client";

import { useCallback, useMemo, useState } from "react";
import { Info, SearchX } from "lucide-react";
import { Badge, Card, ConfirmDialog, EmptyState } from "@/components/ui";
import type { PrintSettings } from "@/features/table-management/lib/print-settings";
import { notify } from "@/lib/toast";
import {
  filterTables,
  listZones,
  summarize,
} from "@/features/table-management/lib/table-utils";
import type {
  CreateSpec,
  DiningTable,
  EditValues,
  StatusFilter,
} from "@/features/table-management/types";
import { PrintDialog } from "./print-dialog";
import { PrintSheet } from "./print-sheet";
import { QrDialog } from "./qr-dialog";
import { SelectionBar } from "./selection-bar";
import { TableCard } from "./table-card";
import { TableFormDialog } from "./table-form-dialog";
import { TablesFilters } from "./tables-filters";
import { TablesPageHeader } from "./tables-page-header";
import { TablesSummary } from "./tables-summary";

type FormTarget = DiningTable | "new" | null;

export interface TableActions {
  open: (table: DiningTable) => Promise<void>;
  close: (table: DiningTable) => Promise<void>;
  /** คืนโต๊ะที่สร้างใหม่ หรือ undefined เมื่อสร้างไม่สำเร็จ (แจ้งสาเหตุให้แล้ว) */
  create: (spec: CreateSpec) => Promise<DiningTable[] | undefined>;
  update: (id: string, values: EditValues) => Promise<boolean>;
  remove: (table: DiningTable) => Promise<boolean>;
}

/**
 * พื้นที่ทำงานของหน้าโต๊ะและคิวอาร์โค้ด (client เพราะมีตัวกรอง ฟอร์ม เปิด-ปิดโต๊ะ และพิมพ์)
 * ไม่ดึงข้อมูลเอง รับข้อมูลและ actions จาก TablesWorkspace จึงใช้เรนเดอร์เป็น skeleton ได้ด้วย
 */
export function TablesView({
  tables,
  actions,
}: {
  tables: DiningTable[];
  actions: TableActions;
}) {
  const [query, setQuery] = useState("");
  const [zone, setZone] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formTarget, setFormTarget] = useState<FormTarget>(null);
  const [qrTable, setQrTable] = useState<DiningTable | null>(null);
  const [pendingClose, setPendingClose] = useState<DiningTable | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DiningTable | null>(null);
  const [printTargets, setPrintTargets] = useState<DiningTable[] | null>(null);
  const [sheet, setSheet] = useState<{
    tables: DiningTable[];
    settings: PrintSettings;
  } | null>(null);

  const zones = useMemo(() => listZones(tables), [tables]);
  const summary = useMemo(() => summarize(tables), [tables]);
  const filtered = useMemo(
    () => filterTables(tables, { query, zone, status }),
    [tables, query, zone, status],
  );
  const selectedTables = tables.filter((t) => selected.has(t.id));
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((t) => selected.has(t.id));
  const editing = formTarget && formTarget !== "new" ? formTarget : null;

  const finishPrint = useCallback(() => setSheet(null), []);

  function openTable(table: DiningTable) {
    void actions.open(table);
  }

  function confirmClose() {
    if (!pendingClose) return;
    void actions.close(pendingClose);
    setPendingClose(null);
  }

  async function handleCreate(spec: CreateSpec) {
    const created = await actions.create(spec);
    if (!created) return;
    // เลือกโต๊ะที่เพิ่งสร้างไว้ให้ พร้อมกดพิมพ์ QR ไปติดโต๊ะได้ทันที
    setSelected(new Set(created.map((t) => t.id)));
    setFormTarget(null);
  }

  async function handleEdit(id: string, values: EditValues) {
    if (await actions.update(id, values)) setFormTarget(null);
  }

  function askDelete(table: DiningTable) {
    if (table.session) {
      notify.warning(`${table.name} ยังเปิดอยู่`, "ปิดโต๊ะก่อนจึงจะลบได้");
      return;
    }
    setPendingDelete(table);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    if (await actions.remove(target)) {
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(target.id);
        return next;
      });
    }
  }

  function select(id: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const t of filtered) {
        if (allFilteredSelected) next.delete(t.id);
        else next.add(t.id);
      }
      return next;
    });
  }

  function reset() {
    setQuery("");
    setZone("");
    setStatus("all");
  }

  return (
    <div className="flex w-full flex-col gap-5 sm:gap-6">
      <TablesPageHeader
        onAdd={() => setFormTarget("new")}
        onPrintAll={() => setPrintTargets(tables)}
        canPrint={tables.length > 0}
      />
      <TablesSummary {...summary} />
      <TablesFilters
        query={query}
        zone={zone}
        status={status}
        zones={zones}
        onQueryChange={setQuery}
        onZoneChange={setZone}
        onStatusChange={setStatus}
      />

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-foreground text-[17px] font-semibold">
              โต๊ะทั้งหมด
            </h2>
            <Badge tone="info">{summary.total} โต๊ะ</Badge>
          </div>
          <p className="text-muted-foreground text-xs">{zones.length} โซน</p>
        </div>

        {filtered.length > 0 ? (
          <ul className="border-border grid gap-4 border-t p-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                selected={selected.has(table.id)}
                onSelect={select}
                onOpen={openTable}
                onClose={setPendingClose}
                onShowQr={setQrTable}
                onEdit={setFormTarget}
                onDelete={askDelete}
              />
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<SearchX className="size-6" aria-hidden />}
            title={
              tables.length === 0 ? "ยังไม่มีโต๊ะ" : "ไม่พบโต๊ะที่ตรงกับตัวกรอง"
            }
            description={
              tables.length === 0
                ? "เพิ่มโต๊ะแรก แล้วพิมพ์ QR ไปติดที่โต๊ะ"
                : "ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองเพื่อดูโต๊ะทั้งหมด"
            }
            actionLabel={tables.length === 0 ? undefined : "ล้างตัวกรอง"}
            onAction={reset}
          />
        )}
      </Card>

      {selectedTables.length > 0 && (
        <SelectionBar
          count={selectedTables.length}
          allSelected={allFilteredSelected}
          onToggleAll={toggleAllFiltered}
          onClear={() => setSelected(new Set())}
          onPrint={() => setPrintTargets(selectedTables)}
        />
      )}

      <p className="text-muted-foreground flex items-start gap-2 text-xs">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        QR ติดโต๊ะถาวร ไม่ต้องพิมพ์ใหม่
        ลูกค้าสั่งอาหารได้เฉพาะตอนที่โต๊ะเปิดอยู่
        และแต่ละครั้งที่เปิดโต๊ะจะได้รหัสรอบใหม่
        ออเดอร์ของลูกค้าแต่ละกลุ่มจึงไม่ปนกัน
      </p>

      <TableFormDialog
        open={formTarget !== null}
        table={editing}
        tables={tables}
        zones={zones}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onClose={() => setFormTarget(null)}
      />
      <QrDialog
        table={qrTable}
        onPrint={(table) => {
          setQrTable(null);
          setPrintTargets([table]);
        }}
        onClose={() => setQrTable(null)}
      />
      <ConfirmDialog
        open={pendingClose !== null}
        title="ปิดโต๊ะนี้หรือไม่?"
        description={
          <>
            <strong>{pendingClose?.name}</strong> (รอบ{" "}
            {pendingClose?.session?.id}) จะจบรอบ ลูกค้าที่ยังสแกน QR
            ค้างอยู่จะสั่งอาหารต่อไม่ได้ ควรปิดหลังชำระเงินเรียบร้อยแล้ว
          </>
        }
        confirmLabel="ปิดโต๊ะ"
        tone="danger"
        onConfirm={confirmClose}
        onCancel={() => setPendingClose(null)}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        title="ลบโต๊ะนี้หรือไม่?"
        description={
          <>
            <strong>{pendingDelete?.name}</strong> จะถูกลบ และ QR
            ที่ติดโต๊ะนี้จะใช้ไม่ได้อีก
          </>
        }
        confirmLabel="ลบโต๊ะ"
        tone="danger"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
      <PrintDialog
        tables={printTargets}
        onPrint={(tables, settings) => {
          setPrintTargets(null);
          setSheet({ tables, settings });
        }}
        onClose={() => setPrintTargets(null)}
      />
      {sheet && (
        <PrintSheet
          tables={sheet.tables}
          settings={sheet.settings}
          onDone={finishPrint}
        />
      )}
    </div>
  );
}
