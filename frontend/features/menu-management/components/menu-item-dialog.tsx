"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { AlertTriangle, ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button, Dialog, FormField, Input, Select, Switch, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { toApiError } from "@/lib/http/api-error";
import { uploadMenuImage } from "@/features/menu-management/lib/menu-api";
import {
  NO_CATEGORY,
  type Category,
  type MenuItem,
  type MenuItemInput,
  type MenuOptionGroup,
} from "@/features/menu-management/types";
import { ImagePicker, type PendingImage } from "./image-picker";
import { OptionGroupsEditor } from "./option-groups-editor";

const MAX_ROWS = 20;

interface MenuItemDialogProps {
  open: boolean;
  /** มีค่า = แก้ไขเมนูนี้ (ทีละรายการ), ไม่มี = เพิ่มเมนูใหม่ได้หลายรายการพร้อมกัน */
  item: MenuItem | null;
  /** หมวดที่เลือกไว้ตอนกดเพิ่ม */
  defaultCategoryId: string | null;
  categories: Category[];
  onCreate: (inputs: MenuItemInput[]) => Promise<void>;
  onUpdate: (id: string, input: MenuItemInput) => Promise<void>;
  onClose: () => void;
}

/** เนื้อหาใน Dialog mount ใหม่ทุกครั้งที่เปิด จึงเริ่มจากค่าล่าสุดเสมอ */
export function MenuItemDialog(props: MenuItemDialogProps) {
  const { open, item, onClose } = props;
  return (
    <Dialog
      open={open}
      title={item ? "แก้ไขเมนูอาหาร" : "เพิ่มเมนูอาหาร"}
      onClose={onClose}
      // สูงคงที่และแบ่งเป็น หัว / รายการที่เลื่อนได้ / ท้าย จึงมีแถบเลื่อนเดียวเฉพาะรายการ ปุ่มบันทึกอยู่ในจอเสมอ
      className="h-[min(92dvh,820px)] w-[min(96vw,760px)] flex-col overflow-hidden open:flex"
    >
      <MenuItemForm {...props} />
    </Dialog>
  );
}

interface Row {
  key: string;
  name: string;
  price: string;
  description: string;
  categoryId: string;
  available: boolean;
  /** URL รูปที่บันทึกไว้แล้ว */
  remote: string;
  /** รูปที่เพิ่งเลือกและตัดแล้ว ยังไม่อัปโหลด */
  pending: PendingImage | null;
  /** อัปโหลดสำเร็จแล้ว (กดบันทึกซ้ำหลังเกิดข้อผิดพลาดจะไม่อัปโหลดรูปเดิมอีก) */
  uploadedUrl: string | null;
  /** เปิดช่องรายละเอียด */
  details: boolean;
  optionGroups: MenuOptionGroup[];
  /** เปิดส่วนตัวเลือก */
  optionsOpen: boolean;
  errors: Partial<Record<"name" | "price" | "image" | "options", string>>;
}

let rowSeed = 0;
const newRow = (categoryId: string, item?: MenuItem | null): Row => ({
  key: `row-${++rowSeed}`,
  name: item?.name ?? "",
  price: item ? String(item.price) : "",
  description: item?.description ?? "",
  categoryId,
  available: item?.available ?? true,
  remote: item?.image ?? "",
  pending: null,
  uploadedUrl: null,
  details: Boolean(item?.description),
  optionGroups: item?.optionGroups ?? [],
  optionsOpen: (item?.optionGroups.length ?? 0) > 0,
  errors: {},
});

const isBlank = (row: Row) =>
  !row.name.trim() &&
  !row.price.trim() &&
  !row.description.trim() &&
  !row.pending &&
  !row.remote &&
  row.optionGroups.length === 0;

function MenuItemForm({ item, defaultCategoryId, categories, onCreate, onUpdate, onClose }: MenuItemDialogProps) {
  const editing = item !== null;
  const initialCategory = item ? (item.categoryId ?? NO_CATEGORY) : (defaultCategoryId ?? NO_CATEGORY);
  const [rows, setRows] = useState<Row[]>(() => [newRow(initialCategory, item)]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string>();
  const list = useRef<HTMLUListElement>(null);
  // แถวที่เพิ่งเพิ่ม: ช่องชื่อของแถวนี้ได้โฟกัสทันที (เบราว์เซอร์เลื่อนรายการให้เห็นเอง)
  const [focusKey, setFocusKey] = useState<string>();

  const categoryOptions = [
    { value: NO_CATEGORY, label: "ไม่มีหมวดหมู่" },
    ...categories.map((category) => ({ value: category.id, label: category.name })),
  ];

  const patchRow = (key: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  function removeImage(row: Row) {
    patchRow(row.key, { remote: "", pending: null, uploadedUrl: null, errors: { ...row.errors, image: undefined } });
  }

  function addRow() {
    const row = newRow(rows[rows.length - 1]?.categoryId ?? NO_CATEGORY);
    setRows((prev) => [...prev, row]);
    setFocusKey(row.key);
  }

  /** Enter ในช่องกรอกของโหมดเพิ่ม = ไปแถวถัดไป (แถวสุดท้ายจะเพิ่มแถวใหม่ให้) ไม่บันทึกทั้งฟอร์มโดยไม่ตั้งใจ */
  function onEnter(event: KeyboardEvent, index: number) {
    if (editing || event.key !== "Enter" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (index === rows.length - 1) {
      if (rows.length < MAX_ROWS) addRow();
      return;
    }
    list.current?.querySelectorAll<HTMLInputElement>("input[data-name]")[index + 1]?.focus();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);

    // ข้ามแถวที่ว่างเปล่า
    const filled = editing ? rows : rows.filter((row) => !isBlank(row));
    if (filled.length === 0) {
      setFormError("กรอกชื่อและราคาของเมนูอย่างน้อย 1 รายการ");
      return;
    }

    let valid = true;
    const checked = filled.map((row) => {
      const errors: Row["errors"] = {};
      const amount = Number(row.price);
      if (!row.name.trim()) errors.name = "กรุณากรอกชื่อเมนู";
      if (row.price.trim() === "" || !Number.isFinite(amount) || amount < 0) errors.price = "กรอกราคาเป็นตัวเลข";
      const badGroup = row.optionGroups.find((g) => !g.name.trim() || g.options.some((o) => !o.name.trim()));
      if (badGroup) errors.options = "ตัวเลือกบางช่องยังไม่ได้ตั้งชื่อ กรอกให้ครบหรือลบช่องที่ไม่ใช้";
      if (Object.keys(errors).length > 0) valid = false;
      return { ...row, errors };
    });
    setRows((prev) => prev.map((row) => checked.find((c) => c.key === row.key) ?? row));
    if (!valid) {
      setFormError("มีช่องที่ยังไม่ถูกต้อง แก้ช่องที่มีข้อความสีแดงแล้วกดบันทึกอีกครั้ง");
      return;
    }

    setSaving(true);
    // อัปโหลดรูปที่เลือกไว้พร้อมกัน (ข้ามรูปที่อัปโหลดสำเร็จไปแล้วจากครั้งก่อน)
    const uploads = await Promise.allSettled(
      checked.map(async (row) => {
        if (row.uploadedUrl) return row.uploadedUrl;
        if (!row.pending) return row.remote;
        return uploadMenuImage(row.pending.blob);
      }),
    );

    let failed = false;
    const withUploads = checked.map((row, index) => {
      const result = uploads[index];
      if (result.status === "fulfilled") {
        return { ...row, uploadedUrl: row.pending ? result.value : null, image: result.value };
      }
      failed = true;
      return { ...row, image: row.remote, errors: { ...row.errors, image: toApiError(result.reason).message } };
    });
    setRows((prev) =>
      prev.map((row) => {
        const done = withUploads.find((r) => r.key === row.key);
        return done ? { ...row, uploadedUrl: done.uploadedUrl ?? row.uploadedUrl, errors: done.errors } : row;
      }),
    );
    if (failed) {
      setFormError("อัปโหลดรูปบางรูปไม่สำเร็จ แก้ไขรายการที่มีข้อความสีแดงแล้วกดบันทึกอีกครั้ง");
      setSaving(false);
      return;
    }

    const inputs: MenuItemInput[] = withUploads.map((row) => ({
      name: row.name.trim(),
      description: row.description.trim(),
      price: Math.round(Number(row.price) * 100) / 100,
      image: row.image,
      available: row.available,
      categoryId: row.categoryId === NO_CATEGORY ? null : row.categoryId,
      optionGroups: row.optionGroups.map((group) => ({
        ...group,
        name: group.name.trim(),
        max: group.type === "multiple" ? group.max : null,
        options: group.options.map((o) => ({ ...o, name: o.name.trim() })),
      })),
    }));

    try {
      if (item) await onUpdate(item.id, inputs[0]);
      else await onCreate(inputs);
    } catch (e) {
      setFormError(toApiError(e).message);
      setSaving(false);
    }
  }

  const count = rows.filter((row) => !isBlank(row)).length;

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="border-border flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-b py-4 pr-16 pl-6">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p aria-hidden className="font-display text-lg font-semibold">
            {editing ? "แก้ไขเมนูอาหาร" : "เพิ่มเมนูอาหาร"}
          </p>
          <p className="text-muted-foreground text-[13px]">
            {editing
              ? "แก้ไขข้อมูลแล้วกดบันทึก"
              : "กรอกทีละแถว กด Enter เพื่อไปแถวถัดไป แถวที่ไม่ได้กรอกจะถูกข้าม"}
          </p>
        </div>
        {!editing && rows.length > 1 && (
          <div className="w-full sm:w-[230px]">
            <Select
              aria-label="ตั้งหมวดหมู่ให้ทุกแถว"
              value=""
              placeholder="ตั้งหมวดให้ทุกแถว…"
              options={categoryOptions}
              onChange={(value) => setRows((prev) => prev.map((row) => ({ ...row, categoryId: value })))}
            />
          </div>
        )}
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-6 py-4">
        <ul ref={list} className="flex flex-col gap-3">
          {rows.map((row, index) => {
            const replacing = editing && row.pending && row.remote;
            const removing = editing && !row.pending && !row.remote && item?.image;
            return (
              <li key={row.key} className="border-border bg-background flex flex-col gap-3 rounded-xl border p-3.5">
                <div className="flex gap-3.5">
                  <ImagePicker
                    compact
                    inputId={`menu-image-${row.key}`}
                    current={row.remote}
                    pending={row.pending}
                    error={row.errors.image}
                    onPendingChange={(pending) =>
                      patchRow(row.key, { pending, uploadedUrl: null, errors: { ...row.errors, image: undefined } })
                    }
                    onRemove={() => removeImage(row)}
                  />

                  <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                    <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_120px]">
                      <FormField label="ชื่อเมนู" htmlFor={`${row.key}-name`} error={row.errors.name} required>
                        <Input
                          id={`${row.key}-name`}
                          data-name
                          value={row.name}
                          invalid={!!row.errors.name}
                          autoFocus={editing ? index === 0 : row.key === focusKey || index === 0}
                          onKeyDown={(e) => onEnter(e, index)}
                          onChange={(e) =>
                            patchRow(row.key, { name: e.target.value, errors: { ...row.errors, name: undefined } })
                          }
                        />
                      </FormField>
                      <FormField label="ราคา (บาท)" htmlFor={`${row.key}-price`} error={row.errors.price} required>
                        <Input
                          id={`${row.key}-price`}
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="any"
                          value={row.price}
                          invalid={!!row.errors.price}
                          onKeyDown={(e) => onEnter(e, index)}
                          onChange={(e) =>
                            patchRow(row.key, { price: e.target.value, errors: { ...row.errors, price: undefined } })
                          }
                        />
                      </FormField>
                    </div>

                    <div className="grid items-center gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
                      <Select
                        aria-label={`หมวดหมู่ของเมนูที่ ${index + 1}`}
                        value={row.categoryId}
                        options={categoryOptions}
                        onChange={(categoryId) => patchRow(row.key, { categoryId })}
                      />
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`${row.key}-available`}
                          checked={row.available}
                          onCheckedChange={(available) => patchRow(row.key, { available })}
                          aria-label={`เมนูที่ ${index + 1} พร้อมขาย`}
                        />
                        <label
                          htmlFor={`${row.key}-available`}
                          className="text-muted-foreground cursor-pointer text-xs whitespace-nowrap"
                        >
                          {row.available ? "พร้อมขาย" : "หมดชั่วคราว"}
                        </label>
                      </div>
                      <button
                        type="button"
                        aria-expanded={row.optionsOpen}
                        onClick={() => patchRow(row.key, { optionsOpen: !row.optionsOpen })}
                        className="text-primary-strong focus-visible:ring-primary/50 flex cursor-pointer items-center gap-1 rounded text-xs font-medium hover:underline focus-visible:ring-2 focus-visible:outline-none"
                      >
                        ตัวเลือก{row.optionGroups.length > 0 && ` (${row.optionGroups.length})`}
                        <ChevronDown
                          className={cn("size-3.5 transition-transform", row.optionsOpen && "rotate-180")}
                          aria-hidden
                        />
                      </button>
                      <button
                        type="button"
                        aria-expanded={row.details}
                        onClick={() => patchRow(row.key, { details: !row.details })}
                        className="text-primary-strong focus-visible:ring-primary/50 flex cursor-pointer items-center gap-1 rounded text-xs font-medium hover:underline focus-visible:ring-2 focus-visible:outline-none"
                      >
                        รายละเอียด
                        <ChevronDown
                          className={cn("size-3.5 transition-transform", row.details && "rotate-180")}
                          aria-hidden
                        />
                      </button>
                    </div>
                  </div>

                  {!editing && rows.length > 1 && (
                    <button
                      type="button"
                      aria-label={`ลบแถวเมนูที่ ${index + 1}`}
                      onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                      className="text-muted-foreground hover:text-danger hover:bg-danger-soft focus-visible:ring-danger/50 flex size-8 shrink-0 cursor-pointer items-center justify-center self-start rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  )}
                </div>

                {row.details && (
                  <Textarea
                    aria-label={`รายละเอียดของเมนูที่ ${index + 1}`}
                    rows={2}
                    value={row.description}
                    placeholder="บอกส่วนผสมหรือรสชาติสั้นๆ ให้ลูกค้าตัดสินใจง่ายขึ้น (ไม่บังคับ)"
                    onChange={(e) => patchRow(row.key, { description: e.target.value })}
                  />
                )}

                {row.optionsOpen && (
                  <div className="flex flex-col gap-2">
                    <OptionGroupsEditor
                      idPrefix={row.key}
                      groups={row.optionGroups}
                      basePrice={row.price.trim() !== "" && Number.isFinite(Number(row.price)) ? Number(row.price) : null}
                      onChange={(optionGroups) =>
                        patchRow(row.key, { optionGroups, errors: { ...row.errors, options: undefined } })
                      }
                    />
                    {row.errors.options && (
                      <p role="alert" className="text-danger text-xs">
                        {row.errors.options}
                      </p>
                    )}
                  </div>
                )}

                {(replacing || removing) && (
                  <p
                    role="status"
                    className="bg-warning-soft text-warning-strong flex items-start gap-2 rounded-lg px-3.5 py-2.5 text-[13px]"
                  >
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {replacing
                      ? "รูปเดิมจะถูกลบและแทนที่ด้วยรูปใหม่เมื่อกดบันทึก ย้อนกลับไม่ได้"
                      : "รูปเดิมจะถูกลบออกจากระบบเมื่อกดบันทึก ย้อนกลับไม่ได้"}
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        {formError && (
          <p role="alert" className="bg-danger-soft text-danger-strong mt-3 rounded-lg px-3.5 py-2.5 text-[13px]">
            {formError}
          </p>
        )}
      </div>

      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4">
        {editing ? (
          <span />
        ) : (
          <Button type="button" variant="outline" disabled={rows.length >= MAX_ROWS || saving} onClick={addRow}>
            <Plus className="size-4" aria-hidden />
            {rows.length >= MAX_ROWS ? `สูงสุด ${MAX_ROWS} เมนู` : "เพิ่มอีกเมนู"}
          </Button>
        )}
        <div className="flex items-center gap-3">
          {!editing && (
            <span className="text-muted-foreground hidden text-xs sm:block">
              {saving ? "กำลังอัปโหลดรูปและบันทึก…" : `พร้อมบันทึก ${count} เมนู`}
            </span>
          )}
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            ยกเลิก
          </Button>
          <Button type="submit" loading={saving}>
            {editing ? "บันทึก" : count > 1 ? `บันทึก ${count} เมนู` : "เพิ่มเมนู"}
          </Button>
        </div>
      </div>
    </form>
  );
}
