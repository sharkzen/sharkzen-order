"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button, Input, Switch } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { MenuOptionGroup, MenuOption } from "@/features/menu-management/types";

const uid = () => crypto.randomUUID().slice(0, 8);

const option = (name = "", price = 0): MenuOption => ({ id: uid(), name, price, available: true });

/** ชุดตัวเลือกสำเร็จรูปที่เจ้าของกดเพิ่มแล้วแก้ต่อได้ */
const PRESETS: { label: string; make: () => MenuOptionGroup }[] = [
  {
    label: "ระดับความเผ็ด",
    make: () => ({
      id: uid(),
      name: "ระดับความเผ็ด",
      type: "single",
      required: true,
      max: null,
      options: [option("เผ็ดน้อย"), option("เผ็ดกลาง"), option("เผ็ดมาก")],
    }),
  },
  {
    label: "ประเภทเครื่องดื่ม",
    make: () => ({
      id: uid(),
      name: "ประเภท",
      type: "single",
      required: true,
      max: null,
      options: [option("เย็น"), option("ปั่น", 5)],
    }),
  },
  {
    label: "ท็อปปิ้ง",
    make: () => ({
      id: uid(),
      name: "ท็อปปิ้ง",
      type: "multiple",
      required: false,
      max: null,
      options: [option("ไข่มุก", 10), option("วิปครีม")],
    }),
  },
  {
    label: "กลุ่มตัวเลือกอื่นๆ",
    make: () => ({
      id: uid(),
      name: "",
      type: "single",
      required: false,
      max: null,
      options: [option(), option()],
    }),
  },
];

interface OptionGroupsEditorProps {
  groups: MenuOptionGroup[];
  onChange: (groups: MenuOptionGroup[]) => void;
  /** ราคาเมนูที่กรอกไว้ ใช้แสดงตัวอย่างราคาที่ลูกค้าจะเห็น (null = ยังไม่กรอก) */
  basePrice: number | null;
  idPrefix: string;
}

const baht = (value: number) => `${value.toLocaleString("th-TH")} บาท`;

/** เซ็นเซอร์ลาก: เมาส์ นิ้วสัมผัส (กดค้างสั้นๆ) และคีย์บอร์ด */
function useReorderSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

/** ปุ่มจับลาก (ใช้ร่วมกันทั้งกลุ่มและตัวเลือก) */
function DragHandle({
  label,
  activatorRef,
  listeners,
  attributes,
  className,
}: {
  label: string;
  activatorRef: (node: HTMLElement | null) => void;
  listeners: ReturnType<typeof useSortable>["listeners"];
  attributes: ReturnType<typeof useSortable>["attributes"];
  className?: string;
}) {
  return (
    <button
      type="button"
      ref={activatorRef}
      aria-label={label}
      title="ลากเพื่อสลับลำดับ"
      {...attributes}
      {...listeners}
      className={cn(
        "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-primary/50 flex shrink-0 cursor-grab touch-none items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none active:cursor-grabbing",
        className,
      )}
    >
      <GripVertical className="size-[18px]" aria-hidden />
    </button>
  );
}

/** ตัวเลือกหนึ่งข้อในกลุ่ม ลากสลับลำดับได้ */
function SortableOption({
  option: o,
  index,
  group,
  onPatch,
  onRemove,
}: {
  option: MenuOption;
  index: number;
  group: MenuOptionGroup;
  onPatch: (patch: Partial<MenuOption>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: o.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "bg-background relative flex items-center gap-1.5 rounded-md",
        isDragging && "shadow-float ring-primary/30 z-10 ring-2",
      )}
    >
      <DragHandle
        label={`ลากเพื่อสลับลำดับตัวเลือก ${o.name || index + 1}`}
        activatorRef={setActivatorNodeRef}
        listeners={listeners}
        attributes={attributes}
        className="size-9"
      />
      <Input
        aria-label={`ชื่อตัวเลือกที่ ${index + 1} ของ ${group.name || "กลุ่ม"}`}
        placeholder="ชื่อตัวเลือก เช่น เผ็ดน้อย"
        value={o.name}
        maxLength={60}
        onChange={(e) => onPatch({ name: e.target.value })}
        className={cn("min-w-0 flex-1", !o.available && "opacity-60")}
      />
      <div className="relative w-28 shrink-0">
        <span aria-hidden className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs">
          +
        </span>
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          aria-label={`ราคาที่บวกเพิ่มของ ${o.name || `ตัวเลือกที่ ${index + 1}`} (บาท)`}
          placeholder="ฟรี"
          value={o.price === 0 ? "" : o.price}
          onChange={(e) => onPatch({ price: Math.max(0, Number(e.target.value) || 0) })}
          className="pr-10 pl-6"
        />
        <span aria-hidden className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
          บาท
        </span>
      </div>
      <Switch
        checked={o.available}
        onCheckedChange={(available) => onPatch({ available })}
        aria-label={`${o.name || `ตัวเลือกที่ ${index + 1}`} พร้อมขาย`}
      />
      <button
        type="button"
        aria-label={`ลบตัวเลือก ${o.name || index + 1}`}
        disabled={group.options.length <= 1}
        onClick={onRemove}
        className="text-muted-foreground hover:text-danger hover:bg-danger-soft focus-visible:ring-danger/50 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </li>
  );
}

/** กลุ่มตัวเลือกหนึ่งกลุ่ม ลากสลับลำดับกลุ่มได้ และลากสลับตัวเลือกภายในกลุ่มได้ */
function SortableGroup({
  group,
  index,
  basePrice,
  idPrefix,
  onPatch,
  onRemove,
}: {
  group: MenuOptionGroup;
  index: number;
  basePrice: number | null;
  idPrefix: string;
  onPatch: (patch: Partial<MenuOptionGroup>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: group.id,
  });
  const sensors = useReorderSensors();

  const patchOption = (optionId: string, patch: Partial<MenuOption>) =>
    onPatch({ options: group.options.map((o) => (o.id === optionId ? { ...o, ...patch } : o)) });

  function onOptionDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = group.options.findIndex((o) => o.id === active.id);
    const to = group.options.findIndex((o) => o.id === over.id);
    if (from >= 0 && to >= 0) onPatch({ options: arrayMove(group.options, from, to) });
  }

  const priced =
    group.type === "single" && basePrice !== null && group.options.some((o) => o.price > 0)
      ? group.options.filter((o) => o.name.trim()).map((o) => `${o.name.trim()} ${baht(basePrice + o.price)}`)
      : [];

  return (
    <fieldset
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "border-border bg-background relative flex min-w-0 flex-col gap-3 rounded-lg border p-3",
        isDragging && "shadow-float border-primary z-20",
      )}
    >
      <legend className="sr-only">กลุ่มตัวเลือกที่ {index + 1}</legend>

      <div className="flex items-start gap-2">
        <DragHandle
          label={`ลากเพื่อสลับลำดับกลุ่ม ${group.name || index + 1}`}
          activatorRef={setActivatorNodeRef}
          listeners={listeners}
          attributes={attributes}
          className="h-[46px] w-8"
        />
        <Input
          aria-label={`ชื่อกลุ่มตัวเลือกที่ ${index + 1}`}
          placeholder="ชื่อกลุ่ม เช่น ระดับความเผ็ด"
          value={group.name}
          maxLength={60}
          onChange={(e) => onPatch({ name: e.target.value })}
          className="flex-1"
        />
        <button
          type="button"
          aria-label={`ลบกลุ่ม ${group.name || index + 1}`}
          onClick={onRemove}
          className="text-muted-foreground hover:text-danger hover:bg-danger-soft focus-visible:ring-danger/50 flex size-[46px] shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div role="group" aria-label="จำนวนที่เลือกได้" className="bg-muted grid grid-cols-2 gap-1 rounded-lg p-1">
          {(["single", "multiple"] as const).map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={group.type === type}
              onClick={() => onPatch({ type, ...(type === "single" && { max: null }) })}
              className={cn(
                "focus-visible:ring-primary/50 h-9 cursor-pointer rounded-md px-3 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none",
                group.type === type ? "bg-surface text-primary-strong shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {type === "single" ? "เลือกได้ข้อเดียว" : "เลือกได้หลายข้อ"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id={`${idPrefix}-${group.id}-required`}
            checked={group.required}
            onCheckedChange={(required) => onPatch({ required })}
            aria-label="ลูกค้าต้องเลือก"
          />
          <label htmlFor={`${idPrefix}-${group.id}-required`} className="text-muted-foreground cursor-pointer text-xs">
            ลูกค้าต้องเลือก
          </label>
        </div>

        {group.type === "multiple" && (
          <label className="text-muted-foreground flex items-center gap-2 text-xs">
            เลือกได้สูงสุด
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={30}
              placeholder="ไม่จำกัด"
              value={group.max ?? ""}
              onChange={(e) => onPatch({ max: e.target.value === "" ? null : Math.max(1, Math.floor(Number(e.target.value))) })}
              className="h-9 w-24 text-center"
            />
          </label>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onOptionDragEnd}>
        <SortableContext items={group.options.map((o) => o.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-2">
            {group.options.map((o, optionIndex) => (
              <SortableOption
                key={o.id}
                option={o}
                index={optionIndex}
                group={group}
                onPatch={(patch) => patchOption(o.id, patch)}
                onRemove={() => onPatch({ options: group.options.filter((x) => x.id !== o.id) })}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={group.options.length >= 30}
          onClick={() => onPatch({ options: [...group.options, option()] })}
        >
          <Plus className="size-4" aria-hidden />
          เพิ่มตัวเลือก
        </Button>
        {priced.length > 0 && <p className="text-muted-foreground text-xs">ลูกค้าจะเห็น: {priced.join(" • ")}</p>}
      </div>
    </fieldset>
  );
}

/**
 * ตัวเลือกของเมนู: กลุ่มที่เลือกได้ข้อเดียว (ความเผ็ด เย็น/ปั่น) หรือหลายข้อ (ท็อปปิ้ง)
 * ราคาของแต่ละตัวเลือกคือราคาที่บวกเพิ่มจากราคาเมนู ใส่ 0 หรือเว้นว่าง = ฟรี
 * ลำดับที่จัดไว้ (ทั้งลำดับกลุ่มและลำดับตัวเลือกในกลุ่ม) คือลำดับที่ลูกค้าเห็น
 */
export function OptionGroupsEditor({ groups, onChange, basePrice, idPrefix }: OptionGroupsEditorProps) {
  const sensors = useReorderSensors();

  const patchGroup = (id: string, patch: Partial<MenuOptionGroup>) =>
    onChange(groups.map((group) => (group.id === id ? { ...group, ...patch } : group)));

  function onGroupDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = groups.findIndex((g) => g.id === active.id);
    const to = groups.findIndex((g) => g.id === over.id);
    if (from >= 0 && to >= 0) onChange(arrayMove(groups, from, to));
  }

  return (
    <div className="border-border bg-surface flex flex-col gap-3 rounded-lg border p-3.5">
      <div>
        <p className="text-foreground text-sm font-semibold">ตัวเลือกของเมนู</p>
        <p className="text-muted-foreground text-xs">
          เช่น ระดับความเผ็ด เย็นหรือปั่น ท็อปปิ้งเพิ่ม ใส่ราคาที่บวกเพิ่มจากราคาเมนู ถ้าฟรีให้เว้นว่างไว้
          {groups.length > 0 && " ลากที่ไอคอนจุดเพื่อจัดลำดับ ลูกค้าจะเห็นตามลำดับนี้"}
        </p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onGroupDragEnd}>
        <SortableContext items={groups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
          {groups.map((group, index) => (
            <SortableGroup
              key={group.id}
              group={group}
              index={index}
              basePrice={basePrice}
              idPrefix={idPrefix}
              onPatch={(patch) => patchGroup(group.id, patch)}
              onRemove={() => onChange(groups.filter((g) => g.id !== group.id))}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            type="button"
            variant="secondary"
            size="sm"
            disabled={groups.length >= 10}
            onClick={() => onChange([...groups, preset.make()])}
          >
            <Plus className="size-4" aria-hidden />
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
