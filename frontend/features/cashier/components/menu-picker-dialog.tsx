"use client";

import { useMemo, useState } from "react";
import { Plus, Search, SearchX, UtensilsCrossed } from "lucide-react";
import { Button, Dialog, Spinner } from "@/components/ui";
import { formatNumber } from "@/features/dashboard/lib/format";
import { cn } from "@/lib/cn";
import type { PickableCategory, PickableMenu } from "./order-editor";

interface MenuPickerDialogProps {
  open: boolean;
  tableName: string;
  menu: PickableMenu[];
  categories: PickableCategory[];
  /** จำนวนจานที่อยู่ในบิลแล้ว แยกตามชื่อเมนู */
  added: Map<string, number>;
  /** เมนูที่กำลังบันทึกอยู่ */
  busyId: string | null;
  onAdd: (item: PickableMenu) => void;
  onClose: () => void;
}

const ALL = "all";
const FEATURED = "featured";

/**
 * หน้าต่างเลือกเมนูให้โต๊ะ: แตะการ์ดเพื่อเพิ่มทีละจาน เปิดค้างไว้เพิ่มได้หลายเมนูต่อเนื่อง
 * ตัวเลขบนการ์ดคือจำนวนที่อยู่ในบิลแล้ว
 */
export function MenuPickerDialog({
  open,
  tableName,
  menu,
  categories,
  added,
  busyId,
  onAdd,
  onClose,
}: MenuPickerDialogProps) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState(ALL);

  const groups = useMemo(() => {
    const used = new Set(menu.map((item) => item.categoryId));
    return [
      { id: ALL, label: "ทั้งหมด" },
      ...(menu.some((item) => item.featured) ? [{ id: FEATURED, label: "แนะนำ" }] : []),
      ...categories.filter((category) => used.has(category.id)).map((category) => ({ id: category.id, label: category.name })),
      ...(used.has(null) && categories.length > 0 ? [{ id: "none", label: "อื่นๆ" }] : []),
    ];
  }, [menu, categories]);

  const keyword = query.trim().toLowerCase();
  const visible = menu.filter((item) => {
    if (keyword && !item.name.toLowerCase().includes(keyword)) return false;
    if (group === ALL) return true;
    if (group === FEATURED) return item.featured;
    if (group === "none") return item.categoryId === null;
    return item.categoryId === group;
  });
  const totalAdded = [...added.values()].reduce((sum, count) => sum + count, 0);

  return (
    <Dialog
      open={open}
      title={`เพิ่มเมนูให้${tableName}`}
      onClose={onClose}
      className="w-[min(96vw,920px)] sm:rounded-2xl"
    >
      <div className="flex h-[min(88dvh,760px)] flex-col">
        <header className="flex flex-col gap-4 px-5 pt-5 pb-4 sm:px-6">
          <div className="pr-10">
            <p className="font-display text-foreground text-xl leading-tight font-semibold">เพิ่มเมนู</p>
            <p className="text-muted-foreground text-[13px]">แตะที่เมนูเพื่อเพิ่มลงบิลของ{tableName}</p>
          </div>

          <div className="relative">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2"
              aria-hidden
            />
            <input
              type="search"
              aria-label="ค้นหาเมนู"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาชื่อเมนู"
              autoFocus
              className="border-border bg-muted placeholder:text-muted-foreground focus-visible:bg-surface focus-visible:ring-primary/50 h-11 w-full rounded-xl border pr-4 pl-11 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
            />
          </div>

          {groups.length > 2 && (
            <div role="group" aria-label="หมวดหมู่" className="chip-row -mx-5 px-5 sm:-mx-6 sm:px-6">
              {groups.map((item) => {
                const active = group === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setGroup(item.id)}
                    className={cn(
                      "focus-visible:ring-primary/50 h-9 shrink-0 cursor-pointer rounded-full border px-4 text-[13px] font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
                      active
                        ? "border-primary bg-primary-soft text-primary-strong"
                        : "border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-muted",
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </header>

        <div className="bg-background scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {visible.length === 0 ? (
            <div className="text-muted-foreground flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center">
              <span className="bg-muted flex size-12 items-center justify-center rounded-full">
                <SearchX className="size-6" aria-hidden />
              </span>
              <p className="text-foreground text-[15px] font-semibold">
                {menu.length === 0 ? "ยังไม่มีเมนูที่พร้อมขาย" : "ไม่พบเมนูที่ค้นหา"}
              </p>
              <p className="text-[13px]">
                {menu.length === 0 ? "เพิ่มเมนูได้ที่หน้าจัดการเมนู" : "ลองพิมพ์ชื่ออื่น หรือเลือกหมวดหมู่ใหม่"}
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {visible.map((item) => (
                <li key={item.id}>
                  <MenuCard
                    item={item}
                    count={added.get(item.name) ?? 0}
                    loading={busyId === item.id}
                    onAdd={() => onAdd(item)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="border-border flex items-center justify-between gap-3 border-t px-5 py-3.5 sm:px-6">
          <p className="text-muted-foreground text-sm">
            ในบิลตอนนี้ <strong className="text-foreground tabular-nums">{totalAdded}</strong> จาน
          </p>
          <Button size="lg" onClick={onClose} className="min-w-32">
            เสร็จสิ้น
          </Button>
        </footer>
      </div>
    </Dialog>
  );
}

function MenuCard({
  item,
  count,
  loading,
  onAdd,
}: {
  item: PickableMenu;
  count: number;
  loading: boolean;
  onAdd: () => void;
}) {
  const blocked = item.needsOptions;
  return (
    <button
      type="button"
      disabled={loading || blocked}
      onClick={onAdd}
      aria-label={`เพิ่ม ${item.name} ฿${formatNumber(item.price)}${count > 0 ? ` อยู่ในบิลแล้ว ${count} จาน` : ""}`}
      className={cn(
        "bg-surface group focus-visible:ring-primary/50 flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border text-left transition-[border-color,box-shadow] focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed",
        count > 0 ? "border-primary shadow-card" : "border-border hover:border-primary/50",
        blocked && "opacity-60",
      )}
    >
      <span className="bg-muted relative flex aspect-square w-full items-center justify-center overflow-hidden">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          <UtensilsCrossed className="text-muted-foreground size-8" aria-hidden />
        )}
        {count > 0 && (
          <span className="bg-primary text-primary-foreground absolute top-2 left-2 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums">
            {count}
          </span>
        )}
        {loading && (
          <span className="bg-surface/70 absolute inset-0 flex items-center justify-center">
            <Spinner className="size-6" />
          </span>
        )}
      </span>
      <span className="flex flex-1 flex-col gap-1 p-3">
        <span className="text-foreground line-clamp-2 min-h-10 text-[13px] leading-5 font-semibold">{item.name}</span>
        <span className="flex items-center justify-between gap-2">
          <span className="font-display text-primary-strong text-base font-semibold tabular-nums">
            ฿{formatNumber(item.price)}
          </span>
          <span
            aria-hidden
            className="bg-primary-soft text-primary-strong group-hover:bg-primary group-hover:text-primary-foreground flex size-7 items-center justify-center rounded-full transition-colors"
          >
            <Plus className="size-4" />
          </span>
        </span>
        {blocked && <span className="text-muted-foreground text-[11px]">ต้องเลือกตัวเลือก ให้ลูกค้าสั่งผ่าน QR</span>}
      </span>
    </button>
  );
}
