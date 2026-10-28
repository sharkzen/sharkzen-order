"use client";

import { useState, type FormEvent } from "react";
import { Button, Dialog, FormField, Input, Switch } from "@/components/ui";
import type { Category } from "@/features/menu-management/types";

interface CategoryDialogProps {
  open: boolean;
  /** มีค่า = แก้ไขหมวดนี้, ไม่มี = สร้างหมวดใหม่ */
  category: Category | null;
  existingNames: string[];
  onSubmit: (values: { name: string; visible: boolean }) => Promise<void>;
  onClose: () => void;
}

/** เนื้อหาใน Dialog mount ใหม่ทุกครั้งที่เปิด จึงเริ่มจากค่าล่าสุดเสมอ */
export function CategoryDialog(props: CategoryDialogProps) {
  const { open, category, onClose } = props;
  return (
    <Dialog
      open={open}
      title={category ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}
      onClose={onClose}
      className="w-[min(94vw,420px)]"
    >
      <CategoryForm {...props} />
    </Dialog>
  );
}

function CategoryForm({ category, existingNames, onSubmit, onClose }: CategoryDialogProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [visible, setVisible] = useState(category?.visible ?? true);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("กรุณากรอกชื่อหมวดหมู่");
    if (trimmed.length > 80) return setError("ชื่อหมวดหมู่ยาวเกิน 80 ตัวอักษร");
    if (existingNames.some((existing) => existing !== category?.name && existing === trimmed)) {
      return setError("มีหมวดหมู่ชื่อนี้อยู่แล้ว");
    }
    setSaving(true);
    try {
      await onSubmit({ name: trimmed, visible });
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex flex-col gap-4 p-6">
        <p aria-hidden className="font-display pr-8 text-lg font-semibold">
          {category ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}
        </p>
        <FormField label="ชื่อหมวดหมู่" htmlFor="category-name" error={error} required>
          <Input
            id="category-name"
            value={name}
            invalid={!!error}
            placeholder="เช่น อาหารจานเดียว"
            onChange={(e) => {
              setName(e.target.value);
              setError(undefined);
            }}
            autoFocus
          />
        </FormField>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <label htmlFor="category-visible" className="text-sm font-medium">
              แสดงให้ลูกค้าเห็น
            </label>
            <span className="text-muted-foreground text-xs">ปิดเพื่อซ่อนทั้งหมวดโดยไม่ต้องลบเมนู</span>
          </div>
          <Switch id="category-visible" checked={visible} onCheckedChange={setVisible} aria-label="แสดงหมวดหมู่ให้ลูกค้าเห็น" />
        </div>
      </div>
      <div className="border-border flex justify-end gap-3 border-t px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose}>
          ยกเลิก
        </Button>
        <Button type="submit" loading={saving}>
          {category ? "บันทึก" : "เพิ่มหมวดหมู่"}
        </Button>
      </div>
    </form>
  );
}
