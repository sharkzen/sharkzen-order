"use client";

import { useState, type FormEvent } from "react";
import { Button, Dialog, FormField, Input, Select } from "@/components/ui";
import {
  MAX_CREATE,
  namesFor,
  nextNumber,
  validateCreate,
  validateEdit,
} from "@/features/table-management/lib/table-utils";
import type { CreateSpec, DiningTable, EditValues } from "@/features/table-management/types";

interface TableFormDialogProps {
  open: boolean;
  /** มีค่า = แก้ไขโต๊ะนี้, ไม่มี = สร้างโต๊ะใหม่ (ได้หลายโต๊ะ) */
  table: DiningTable | null;
  tables: DiningTable[];
  zones: string[];
  onCreate: (spec: CreateSpec) => void;
  onEdit: (id: string, values: EditValues) => void;
  onClose: () => void;
}

/** เนื้อหาใน Dialog mount ใหม่ทุกครั้งที่เปิด จึงเริ่มจากค่าล่าสุดเสมอ */
export function TableFormDialog(props: TableFormDialogProps) {
  const { open, table, onClose } = props;
  return (
    <Dialog
      open={open}
      title={table ? "แก้ไขโต๊ะ" : "เพิ่มโต๊ะ"}
      onClose={onClose}
      className="w-[min(94vw,460px)]"
    >
      {table ? (
        <EditForm {...props} table={table} />
      ) : (
        <CreateForm {...props} />
      )}
    </Dialog>
  );
}

function ZoneField({
  value,
  error,
  zones,
  onChange,
}: {
  value: string;
  error?: string;
  zones: string[];
  onChange: (value: string) => void;
}) {
  return (
    <FormField
      label="โซน"
      htmlFor="table-form-zone"
      error={error}
      hint="เลือกโซนที่มี หรือพิมพ์ชื่อโซนใหม่"
      required
    >
      <Select
        id="table-form-zone"
        value={value}
        invalid={!!error}
        creatable
        placeholder="เลือกหรือพิมพ์ชื่อโซน"
        searchPlaceholder="ค้นหาหรือพิมพ์ชื่อโซนใหม่"
        onChange={onChange}
        options={zones.map((z) => ({ value: z, label: z }))}
      />
    </FormField>
  );
}

function Footer({
  onClose,
  submitLabel,
}: {
  onClose: () => void;
  submitLabel: string;
}) {
  return (
    <div className="border-border flex justify-end gap-3 border-t px-6 py-4">
      <Button variant="outline" onClick={onClose}>
        ยกเลิก
      </Button>
      <Button type="submit">{submitLabel}</Button>
    </div>
  );
}

function CreateForm({
  tables,
  zones,
  onCreate,
  onClose,
}: TableFormDialogProps) {
  const [prefix, setPrefix] = useState("โต๊ะ");
  const [start, setStart] = useState(String(nextNumber(tables)));
  const [count, setCount] = useState("1");
  const [zone, setZone] = useState(zones[0] ?? "");
  const [seats, setSeats] = useState("4");
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateSpec, string>>
  >({});

  const spec: CreateSpec = {
    prefix: prefix.trim(),
    start: Number(start),
    count: Number(count),
    zone: zone.trim(),
    seats: Number(seats),
  };
  const names = namesFor(spec);
  const preview =
    names.length === 0
      ? null
      : names.length === 1
        ? names[0]
        : `${names[0]} ถึง ${names[names.length - 1]} (${names.length} โต๊ะ)`;

  function submit(e: FormEvent) {
    e.preventDefault();
    const found = validateCreate(spec, tables);
    setErrors(found);
    if (Object.keys(found).length === 0) onCreate(spec);
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-1 pr-8">
          <p aria-hidden className="font-display text-lg font-semibold">
            เพิ่มโต๊ะ
          </p>
          <p className="text-muted-foreground text-xs">
            สร้างได้หลายโต๊ะพร้อมกัน เลขจะเรียงต่อกันให้อัตโนมัติ
          </p>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_96px_96px] gap-3">
          <FormField
            label="คำนำหน้า"
            htmlFor="table-prefix"
            error={errors.prefix}
            required
          >
            <Input
              id="table-prefix"
              value={prefix}
              invalid={!!errors.prefix}
              onChange={(e) => setPrefix(e.target.value)}
            />
          </FormField>
          <FormField label="เริ่มที่เลข" htmlFor="table-start" required>
            <Input
              id="table-start"
              type="number"
              inputMode="numeric"
              min={1}
              value={start}
              invalid={!!errors.start}
              onChange={(e) => setStart(e.target.value)}
            />
          </FormField>
          <FormField label="จำนวน" htmlFor="table-count" required>
            <Input
              id="table-count"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_CREATE}
              value={count}
              invalid={!!errors.count}
              onChange={(e) => setCount(e.target.value)}
            />
          </FormField>
        </div>
        {(errors.start || errors.count) && (
          <p role="alert" className="text-danger -mt-2 text-xs">
            {errors.start ?? errors.count}
          </p>
        )}

        <ZoneField
          value={zone}
          error={errors.zone}
          zones={zones}
          onChange={setZone}
        />

        <FormField
          label="จำนวนที่นั่งต่อโต๊ะ"
          htmlFor="table-seats"
          error={errors.seats}
          required
        >
          <Input
            id="table-seats"
            type="number"
            inputMode="numeric"
            min={1}
            max={30}
            value={seats}
            invalid={!!errors.seats}
            onChange={(e) => setSeats(e.target.value)}
          />
        </FormField>

        <p
          aria-live="polite"
          className="bg-primary-soft text-primary-strong min-h-[38px] rounded-lg px-3.5 py-2 text-[13px]"
        >
          {preview ? (
            <>
              จะสร้าง: <strong>{preview}</strong>
            </>
          ) : (
            "กรอกข้อมูลเพื่อดูตัวอย่างโต๊ะที่จะสร้าง"
          )}
        </p>
      </div>
      <Footer
        onClose={onClose}
        submitLabel={
          names.length > 1 ? `สร้าง ${names.length} โต๊ะ` : "เพิ่มโต๊ะ"
        }
      />
    </form>
  );
}

function EditForm({
  table,
  tables,
  zones,
  onEdit,
  onClose,
}: TableFormDialogProps & { table: DiningTable }) {
  const [name, setName] = useState(table.name);
  const [zone, setZone] = useState(table.zone);
  const [seats, setSeats] = useState(String(table.seats));
  const [errors, setErrors] = useState<
    Partial<Record<keyof EditValues, string>>
  >({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const values = {
      name: name.trim(),
      zone: zone.trim(),
      seats: Number(seats),
    };
    const found = validateEdit(values, tables, table.id);
    setErrors(found);
    if (Object.keys(found).length === 0) onEdit(table.id, values);
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex flex-col gap-4 p-6">
        <p aria-hidden className="font-display pr-8 text-lg font-semibold">
          แก้ไขโต๊ะ
        </p>
        <FormField
          label="ชื่อโต๊ะ"
          htmlFor="table-name"
          error={errors.name}
          required
        >
          <Input
            id="table-name"
            value={name}
            invalid={!!errors.name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </FormField>
        <ZoneField
          value={zone}
          error={errors.zone}
          zones={zones}
          onChange={setZone}
        />
        <FormField
          label="จำนวนที่นั่ง"
          htmlFor="table-seats"
          error={errors.seats}
          required
        >
          <Input
            id="table-seats"
            type="number"
            inputMode="numeric"
            min={1}
            max={30}
            value={seats}
            invalid={!!errors.seats}
            onChange={(e) => setSeats(e.target.value)}
          />
        </FormField>
        <p className="text-muted-foreground text-xs">
          QR ของโต๊ะไม่เปลี่ยนเมื่อแก้ไขชื่อ จึงไม่ต้องพิมพ์ใหม่
        </p>
      </div>
      <Footer onClose={onClose} submitLabel="บันทึก" />
    </form>
  );
}
