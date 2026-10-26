"use client";

import { useMemo, useState } from "react";
import { Info, SearchX } from "lucide-react";
import {
  Badge,
  Card,
  ConfirmDialog,
  EmptyState,
  Pagination,
} from "@/components/ui";
import { notify } from "@/lib/toast";
import { UPDATED_AT } from "../data/menus";
import {
  PAGE_SIZE,
  filterMenus,
  listCategories,
  summarize,
} from "../lib/menu-utils";
import type { MenuItem, SaleFilter } from "../types";
import { MenuFilters } from "./menu-filters";
import { MenuList } from "./menu-list";
import { MenuPageHeader } from "./menu-page-header";
import { MenuSummary } from "./menu-summary";

/**
 * พื้นที่ทำงานของหน้าจัดการเมนู (client เพราะมีตัวกรอง สวิตช์ขาย และการลบ)
 * สถานะเก็บในหน้านี้ก่อน เมื่อมี API ให้เรียกบันทึกที่ onToggle / onDelete
 */
export function MenuWorkspace({ initialMenus }: { initialMenus: MenuItem[] }) {
  const [menus, setMenus] = useState(initialMenus);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sale, setSale] = useState<SaleFilter>("all");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<MenuItem | null>(null);

  const categories = useMemo(() => listCategories(menus), [menus]);
  const summary = useMemo(() => summarize(menus), [menus]);
  const filtered = useMemo(
    () => filterMenus(menus, { query, category, sale }),
    [menus, query, category, sale],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  function toggle(id: string, available: boolean) {
    const target = menus.find((menu) => menu.id === id);
    setMenus((prev) =>
      prev.map((menu) => (menu.id === id ? { ...menu, available } : menu)),
    );
    if (target) {
      notify.success(
        available
          ? `เปิดขาย ${target.name} แล้ว`
          : `ปิดขาย ${target.name} ชั่วคราวแล้ว`,
        "ลูกค้าจะเห็นการเปลี่ยนแปลงบนหน้าสั่งอาหารทันที",
      );
    }
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    setMenus((prev) => prev.filter((menu) => menu.id !== pendingDelete.id));
    notify.success(`ลบ ${pendingDelete.name} แล้ว`);
    setPendingDelete(null);
  }

  function reset() {
    setQuery("");
    setCategory("");
    setSale("all");
    setPage(1);
  }

  return (
    <div className="flex w-full flex-col gap-5 sm:gap-6">
      <MenuPageHeader />
      <MenuSummary {...summary} />
      <MenuFilters
        query={query}
        category={category}
        sale={sale}
        categories={categories}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        onCategoryChange={(value) => {
          setCategory(value);
          setPage(1);
        }}
        onSaleChange={(value) => {
          setSale(value);
          setPage(1);
        }}
      />

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-foreground text-[17px] font-semibold">
              เมนูอาหารทั้งหมด
            </h2>
            <Badge tone="info">{summary.total} เมนู</Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            {categories.length} หมวดหมู่ • แก้ไขล่าสุด {UPDATED_AT}
          </p>
        </div>

        {visible.length > 0 ? (
          <>
            <MenuList
              menus={visible}
              onToggle={toggle}
              onDelete={setPendingDelete}
            />
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              from={start + 1}
              to={start + visible.length}
              total={filtered.length}
              onChange={setPage}
            />
          </>
        ) : (
          <EmptyState
            icon={<SearchX className="size-6" aria-hidden />}
            title={
              menus.length === 0
                ? "ยังไม่มีเมนูอาหาร"
                : "ไม่พบเมนูที่ตรงกับตัวกรอง"
            }
            description={
              menus.length === 0
                ? "เพิ่มเมนูแรกของร้านเพื่อให้ลูกค้าเริ่มสั่งอาหารได้"
                : "ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองเพื่อดูเมนูทั้งหมด"
            }
            actionLabel={menus.length === 0 ? undefined : "ล้างตัวกรอง"}
            onAction={reset}
          />
        )}
      </Card>

      <p className="text-muted-foreground flex items-start gap-2 text-xs">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        การเปลี่ยนราคาและสถานะการขายจะแสดงบนหน้าสั่งอาหารของลูกค้าทันที
        โดยไม่กระทบคำสั่งซื้อที่รับแล้ว
      </p>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="ลบเมนูนี้หรือไม่?"
        description={
          <>
            เมนู <strong>{pendingDelete?.name}</strong>{" "}
            จะหายจากหน้าสั่งอาหารของลูกค้า
            ส่วนคำสั่งซื้อที่รับไปแล้วจะไม่ได้รับผลกระทบ
          </>
        }
        confirmLabel="ลบเมนู"
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
