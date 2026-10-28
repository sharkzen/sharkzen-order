"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Info, SearchX } from "lucide-react";
import { Card, Checkbox, ConfirmDialog, EmptyState } from "@/components/ui";
import {
  countByCategory,
  matchesFilters,
  sortedCategories,
  summarize,
  toBoard,
  type Board,
} from "@/features/menu-management/lib/menu-utils";
import { notify } from "@/lib/toast";
import {
  MAX_FEATURED,
  NO_CATEGORY,
  type Category,
  type MenuData,
  type MenuItem,
  type MenuItemInput,
  type SaleFilter,
} from "@/features/menu-management/types";
import { CategoryDialog } from "./category-dialog";
import { CategoryPanel } from "./category-panel";
import { MenuFilters } from "./menu-filters";
import { MenuItemDialog } from "./menu-item-dialog";
import { MenuPageHeader } from "./menu-page-header";
import { MenuRowBody } from "./menu-row";
import { MenuSection } from "./menu-section";
import { MenuSummary } from "./menu-summary";

export interface MenuActions {
  createItems: (inputs: MenuItemInput[]) => Promise<void>;
  updateItem: (id: string, input: MenuItemInput) => Promise<void>;
  deleteItem: (item: MenuItem) => Promise<void>;
  toggleAvailable: (item: MenuItem, available: boolean) => void;
  toggleFeatured: (item: MenuItem, featured: boolean) => void;
  createCategory: (values: { name: string; visible: boolean }) => Promise<void>;
  updateCategory: (id: string, values: { name: string; visible: boolean }) => Promise<void>;
  /** deleteItems = ลบเมนูทั้งหมดในหมวดด้วย */
  deleteCategory: (category: Category, deleteItems: boolean) => Promise<void>;
  reorderCategories: (ids: string[]) => void;
  /** board = ลำดับใหม่ของทุกหมวดหลังลาก */
  reorderItems: (board: Board) => void;
}

type ItemDialog = { item: MenuItem | null; categoryId: string | null } | null;
type CategoryTarget = Category | "new" | null;

interface MenuViewProps {
  data: MenuData;
  actions: MenuActions;
}

/** หน้าจอจัดการเมนู (ไม่ดึงข้อมูลเอง) รับข้อมูลและ actions จาก MenuWorkspace จึงใช้เรนเดอร์เป็น skeleton ได้ด้วย */
export function MenuView({ data, actions }: MenuViewProps) {
  const [query, setQuery] = useState("");
  const [sale, setSale] = useState<SaleFilter>("all");
  const [selected, setSelected] = useState("");
  const [itemDialog, setItemDialog] = useState<ItemDialog>(null);
  const [categoryTarget, setCategoryTarget] = useState<CategoryTarget>(null);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<MenuItem | null>(null);
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<Category | null>(null);
  const [alsoDeleteItems, setAlsoDeleteItems] = useState(false);
  const [dragBoard, setDragBoard] = useState<Board | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const categories = useMemo(() => sortedCategories(data.categories), [data.categories]);
  const itemsById = useMemo(() => new Map(data.items.map((item) => [item.id, item])), [data.items]);
  const baseBoard = useMemo(() => toBoard(data), [data]);
  const board = dragBoard ?? baseBoard;
  const counts = useMemo(() => countByCategory(data.items), [data.items]);
  const summary = useMemo(() => summarize(data.items), [data.items]);

  // ขณะค้นหาหรือกรอง ลำดับที่เห็นไม่ใช่ลำดับจริง จึงปิดการลาก
  const sortable = query.trim() === "" && sale === "all";
  const filters = { query, sale };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const containerOf = (id: string, current: Board) =>
    id in current ? id : Object.keys(current).find((key) => current[key]?.includes(id));

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
    setDragBoard(baseBoard);
  }

  /** ลากข้ามหมวด: ย้ายเมนูไปอยู่ในหมวดที่กำลังชี้อยู่ทันที เพื่อให้แถวขยับหลบระหว่างลาก */
  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const activeKey = String(active.id);
    const overKey = String(over.id);
    setDragBoard((prev) => {
      if (!prev) return prev;
      const from = containerOf(activeKey, prev);
      const to = containerOf(overKey, prev);
      if (!from || !to || from === to) return prev;

      const target = prev[to] ?? [];
      const overIndex = target.indexOf(overKey);
      let index = target.length;
      if (overIndex >= 0) {
        const translated = active.rect.current.translated;
        const below = translated ? translated.top > over.rect.top + over.rect.height / 2 : false;
        index = overIndex + (below ? 1 : 0);
      }
      return {
        ...prev,
        [from]: (prev[from] ?? []).filter((id) => id !== activeKey),
        [to]: [...target.slice(0, index), activeKey, ...target.slice(index)],
      };
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    const current = dragBoard;
    setActiveId(null);
    setDragBoard(null);
    if (!current || !over) return;

    const activeKey = String(active.id);
    const container = containerOf(activeKey, current);
    const overContainer = containerOf(String(over.id), current);
    // ย้ายข้ามหมวดเสร็จไปแล้วใน onDragOver ที่นี่เหลือเรียงลำดับภายในหมวดเดียวกัน
    let final = current;
    if (container && container === overContainer) {
      const ids = current[container] ?? [];
      const from = ids.indexOf(activeKey);
      const to = ids.indexOf(String(over.id));
      if (from >= 0 && to >= 0 && from !== to) {
        final = { ...current, [container]: arrayMove(ids, from, to) };
      }
    }
    const changed = Object.keys(final).some(
      (key) => final[key]?.join() !== baseBoard[key]?.join(),
    );
    if (changed) actions.reorderItems(final);
  }

  const rowActions = {
    onToggle: (id: string, available: boolean) => {
      const item = itemsById.get(id);
      if (item) actions.toggleAvailable(item, available);
    },
    onToggleFeatured: (id: string, featured: boolean) => {
      const item = itemsById.get(id);
      if (!item) return;
      if (featured && data.items.filter((existing) => existing.featured).length >= MAX_FEATURED) {
        notify.warning(
          `แนะนำได้ไม่เกิน ${MAX_FEATURED} เมนู`,
          "กดดาวที่เมนูที่แนะนำอยู่เพื่อยกเลิก แล้วเลือกเมนูใหม่",
        );
        return;
      }
      actions.toggleFeatured(item, featured);
    },
    onEdit: (item: MenuItem) => setItemDialog({ item, categoryId: item.categoryId }),
    onDelete: setPendingDeleteItem,
  };

  const sections = [
    ...categories.map((category) => ({
      id: category.id,
      title: category.name,
      hidden: !category.visible,
    })),
    ...((counts.get(NO_CATEGORY) ?? 0) > 0 || selected === NO_CATEGORY
      ? [{ id: NO_CATEGORY, title: "ไม่มีหมวดหมู่", hidden: false }]
      : []),
  ].filter((section) => selected === "" || section.id === selected);

  const visibleCount = sections.reduce(
    (sum, section) =>
      sum +
      (board[section.id] ?? []).filter((id) => {
        const item = itemsById.get(id);
        return item && matchesFilters(item, filters);
      }).length,
    0,
  );
  const activeItem = activeId ? itemsById.get(activeId) : undefined;

  function reset() {
    setQuery("");
    setSale("all");
    setSelected("");
  }

  const pendingCategoryCount = pendingDeleteCategory ? (counts.get(pendingDeleteCategory.id) ?? 0) : 0;
  const defaultCategory = selected && selected !== NO_CATEGORY ? selected : null;

  return (
    <div className="flex w-full flex-col gap-5 sm:gap-6">
      <MenuPageHeader onAddItem={() => setItemDialog({ item: null, categoryId: defaultCategory })} />
      <MenuSummary {...summary} />
      <p className="text-muted-foreground bg-primary-soft rounded-xl px-4 py-3 text-sm leading-relaxed">
        <span className="text-primary-strong font-semibold">
          เมนูแนะนำ {data.items.filter((item) => item.featured).length}/{MAX_FEATURED}
        </span>{" "}
        แนะนำได้ไม่เกิน {MAX_FEATURED} เมนู ควรเลือกเมนูขายดีของร้าน กดดาวที่เมนูเพื่อแนะนำ
        ลูกค้าจะเห็นที่ด้านบนสุดของหน้าสั่งอาหาร
      </p>
      <MenuFilters query={query} sale={sale} onQueryChange={setQuery} onSaleChange={setSale} />

      <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <CategoryPanel
          categories={categories}
          counts={counts}
          total={data.items.length}
          selected={selected}
          onSelect={setSelected}
          onReorder={actions.reorderCategories}
          onAdd={() => setCategoryTarget("new")}
          onEdit={setCategoryTarget}
          onDelete={(category) => {
            setAlsoDeleteItems(false);
            setPendingDeleteCategory(category);
          }}
          onToggleVisible={(category) =>
            void actions.updateCategory(category.id, { name: category.name, visible: !category.visible })
          }
        />

        <div className="flex min-w-0 flex-col gap-5">
          {!sortable && (
            <p className="bg-warning-soft text-warning-strong flex items-start gap-2 rounded-lg px-4 py-3 text-[13px]">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              ล้างคำค้นหาและตัวกรองสถานะก่อน จึงจะลากจัดลำดับได้
            </p>
          )}

          <DndContext
            id="menu-items"
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDragCancel={() => {
              setActiveId(null);
              setDragBoard(null);
            }}
          >
            {sections.map((section) => (
              <MenuSection
                key={section.id}
                id={section.id}
                title={section.title}
                hidden={section.hidden}
                total={(board[section.id] ?? []).length}
                menus={(board[section.id] ?? [])
                  .map((id) => itemsById.get(id))
                  .filter((item): item is MenuItem => !!item && matchesFilters(item, filters))}
                sortable={sortable}
                onAdd={() =>
                  setItemDialog({ item: null, categoryId: section.id === NO_CATEGORY ? null : section.id })
                }
                {...rowActions}
              />
            ))}
            <DragOverlay>
              {activeItem ? (
                <ul>
                  <MenuRowBody menu={activeItem} dragging {...rowActions} />
                </ul>
              ) : null}
            </DragOverlay>
          </DndContext>

          {(sections.length === 0 || (visibleCount === 0 && !sortable)) && (
            <Card className="p-0">
              <EmptyState
                icon={<SearchX className="size-6" aria-hidden />}
                title={data.items.length === 0 ? "ยังไม่มีเมนูอาหาร" : "ไม่พบเมนูที่ตรงกับตัวกรอง"}
                description={
                  data.items.length === 0
                    ? "เพิ่มหมวดหมู่และเมนูแรกของร้านเพื่อให้ลูกค้าเริ่มสั่งอาหารได้"
                    : "ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองเพื่อดูเมนูทั้งหมด"
                }
                actionLabel={data.items.length === 0 ? "เพิ่มเมนูอาหาร" : "ล้างตัวกรอง"}
                onAction={
                  data.items.length === 0 ? () => setItemDialog({ item: null, categoryId: null }) : reset
                }
              />
            </Card>
          )}
        </div>
      </div>

      <p className="text-muted-foreground flex items-start gap-2 text-xs">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        ลำดับหมวดและเมนู ราคา และสถานะการขาย จะแสดงบนหน้าสั่งอาหารของลูกค้าทันที โดยไม่กระทบคำสั่งซื้อที่รับแล้ว
      </p>

      <MenuItemDialog
        key={itemDialog?.item?.id ?? `new-${itemDialog?.categoryId ?? ""}`}
        open={itemDialog !== null}
        item={itemDialog?.item ?? null}
        defaultCategoryId={itemDialog?.categoryId ?? null}
        categories={categories}
        onClose={() => setItemDialog(null)}
        onCreate={async (inputs) => {
          await actions.createItems(inputs);
          setItemDialog(null);
        }}
        onUpdate={async (id, input) => {
          await actions.updateItem(id, input);
          setItemDialog(null);
        }}
      />

      <CategoryDialog
        key={categoryTarget && categoryTarget !== "new" ? categoryTarget.id : "new"}
        open={categoryTarget !== null}
        category={categoryTarget && categoryTarget !== "new" ? categoryTarget : null}
        existingNames={categories.map((category) => category.name)}
        onClose={() => setCategoryTarget(null)}
        onSubmit={async (values) => {
          if (categoryTarget && categoryTarget !== "new") {
            await actions.updateCategory(categoryTarget.id, values);
          } else {
            await actions.createCategory(values);
          }
          setCategoryTarget(null);
        }}
      />

      <ConfirmDialog
        open={pendingDeleteItem !== null}
        title="ลบเมนูนี้หรือไม่?"
        description={
          <>
            เมนู <strong>{pendingDeleteItem?.name}</strong> จะหายจากหน้าสั่งอาหารของลูกค้า
            ส่วนคำสั่งซื้อที่รับไปแล้วจะไม่ได้รับผลกระทบ
          </>
        }
        confirmLabel="ลบเมนู"
        tone="danger"
        onConfirm={() => {
          if (pendingDeleteItem) void actions.deleteItem(pendingDeleteItem);
          setPendingDeleteItem(null);
        }}
        onCancel={() => setPendingDeleteItem(null)}
      />

      <ConfirmDialog
        open={pendingDeleteCategory !== null}
        title="ลบหมวดหมู่นี้หรือไม่?"
        description={
          <span className="flex flex-col gap-3">
            <span>
              หมวด <strong>{pendingDeleteCategory?.name}</strong> จะถูกลบ
              {pendingCategoryCount > 0 &&
                (alsoDeleteItems
                  ? ` พร้อมเมนูในหมวดนี้ทั้งหมด ${pendingCategoryCount} รายการ`
                  : ` เมนูในหมวด ${pendingCategoryCount} รายการจะย้ายไปอยู่ใน “ไม่มีหมวดหมู่”`)}
              {" "}คำสั่งซื้อที่รับไปแล้วไม่ได้รับผลกระทบ
            </span>
            {pendingCategoryCount > 0 && (
              <span className="border-border hover:bg-muted block rounded-lg border p-3">
                <Checkbox
                  checked={alsoDeleteItems}
                  onChange={(e) => setAlsoDeleteItems(e.target.checked)}
                  label={
                    <span className="flex flex-col gap-0.5">
                      <span className="text-foreground text-[13px] font-medium">ลบเมนูทั้งหมดในหมวดนี้ด้วย</span>
                      <span className="text-muted-foreground text-xs">
                        เมนูและรูปจะหายไปถาวร ย้อนกลับไม่ได้ ไม่เลือก = เก็บเมนูไว้
                      </span>
                    </span>
                  }
                />
              </span>
            )}
          </span>
        }
        confirmLabel={alsoDeleteItems && pendingCategoryCount > 0 ? "ลบหมวดและเมนู" : "ลบหมวดหมู่"}
        tone="danger"
        onConfirm={() => {
          if (pendingDeleteCategory) {
            if (selected === pendingDeleteCategory.id) setSelected("");
            void actions.deleteCategory(pendingDeleteCategory, alsoDeleteItems && pendingCategoryCount > 0);
          }
          setPendingDeleteCategory(null);
        }}
        onCancel={() => setPendingDeleteCategory(null)}
      />
    </div>
  );
}
