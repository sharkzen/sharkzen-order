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
import { Eye, EyeOff, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import { NO_CATEGORY, type Category } from "@/features/menu-management/types";

interface CategoryPanelProps {
  categories: Category[];
  counts: Map<string, number>;
  total: number;
  /** "" = ทุกหมวดหมู่ */
  selected: string;
  onSelect: (id: string) => void;
  onReorder: (ids: string[]) => void;
  onAdd: () => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onToggleVisible: (category: Category) => void;
}

const chip =
  "focus-visible:ring-primary/50 flex min-h-[44px] w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 text-left text-[13px] transition-colors focus-visible:ring-2 focus-visible:outline-none";

function FixedItem({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        chip,
        active ? "bg-primary-soft text-primary-strong font-semibold" : "text-foreground hover:bg-muted",
      )}
    >
      <span className="flex-1">{label}</span>
      <span className="text-muted-foreground text-xs">{count}</span>
    </button>
  );
}

interface RowProps extends Omit<CategoryPanelProps, "categories" | "onReorder" | "onAdd" | "total" | "counts"> {
  category: Category;
  count: number;
}

function CategoryRow({ category, count, selected, onSelect, onEdit, onDelete, onToggleVisible }: RowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: category.id });
  const active = selected === category.id;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "group flex items-center rounded-lg",
        active ? "bg-primary-soft" : "hover:bg-muted",
        isDragging && "shadow-float bg-surface relative z-10 opacity-90",
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        aria-label={`ลากเพื่อจัดลำดับหมวด ${category.name}`}
        {...attributes}
        {...listeners}
        className="text-muted-foreground focus-visible:ring-primary/50 flex size-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none active:cursor-grabbing"
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => onSelect(category.id)}
        aria-pressed={active}
        className="focus-visible:ring-primary/50 flex min-h-[44px] min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md py-1 text-left focus-visible:ring-2 focus-visible:outline-none"
      >
        <span
          className={cn(
            "flex-1 truncate text-[13px]",
            active ? "text-primary-strong font-semibold" : "text-foreground",
            !category.visible && "text-muted-foreground",
          )}
        >
          {category.name}
        </span>
        <span className="text-muted-foreground text-xs">{count}</span>
      </button>
      <div className="flex shrink-0 items-center pr-1">
        <button
          type="button"
          aria-label={category.visible ? `ซ่อนหมวด ${category.name} จากลูกค้า` : `แสดงหมวด ${category.name} ให้ลูกค้า`}
          onClick={() => onToggleVisible(category)}
          className="text-muted-foreground hover:text-foreground hover:bg-surface focus-visible:ring-primary/50 flex size-8 cursor-pointer items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none"
        >
          {category.visible ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
        </button>
        <button
          type="button"
          aria-label={`แก้ไขหมวด ${category.name}`}
          onClick={() => onEdit(category)}
          className="text-muted-foreground hover:text-foreground hover:bg-surface focus-visible:ring-primary/50 flex size-8 cursor-pointer items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none"
        >
          <Pencil className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label={`ลบหมวด ${category.name}`}
          onClick={() => onDelete(category)}
          className="text-muted-foreground hover:text-danger hover:bg-surface focus-visible:ring-danger/50 flex size-8 cursor-pointer items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>
    </li>
  );
}

/** แผงหมวดหมู่: ลากเรียงลำดับหมวด (หมวดบนสุดแสดงก่อนให้ลูกค้า) กดเลือกเพื่อดูเฉพาะหมวด */
export function CategoryPanel({
  categories,
  counts,
  total,
  selected,
  onSelect,
  onReorder,
  onAdd,
  ...rowActions
}: CategoryPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const ids = categories.map((category) => category.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(ids, from, to));
  }

  const uncategorized = counts.get(NO_CATEGORY) ?? 0;

  return (
    <Card className="flex flex-col gap-3 p-4 lg:sticky lg:top-24">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-foreground text-[15px] font-semibold">หมวดหมู่</h2>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="size-4" aria-hidden />
          เพิ่ม
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">ลากที่ไอคอนจุดเพื่อจัดลำดับ หมวดบนสุดจะแสดงก่อนให้ลูกค้า</p>

      <ul className="flex flex-col gap-1">
        <li>
          <FixedItem label="ทุกหมวดหมู่" count={total} active={selected === ""} onClick={() => onSelect("")} />
        </li>
      </ul>

      <DndContext id="menu-categories" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={categories.map((category) => category.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-1">
            {categories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                count={counts.get(category.id) ?? 0}
                selected={selected}
                onSelect={onSelect}
                {...rowActions}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {uncategorized > 0 && (
        <ul className="flex flex-col gap-1">
          <li>
            <FixedItem
              label="ไม่มีหมวดหมู่"
              count={uncategorized}
              active={selected === NO_CATEGORY}
              onClick={() => onSelect(NO_CATEGORY)}
            />
          </li>
        </ul>
      )}
    </Card>
  );
}
