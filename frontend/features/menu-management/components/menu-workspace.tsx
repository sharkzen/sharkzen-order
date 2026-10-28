"use client";

import { useMemo } from "react";
import { Button, Card, Skeleton } from "@/components/ui";
import { useResource } from "@/hooks/use-resource";
import { SocketEvent } from "@/lib/socket";
import { notify } from "@/lib/toast";
import { menuApi } from "@/features/menu-management/lib/menu-api";
import { applyBoard, containerOf, reorderCategories } from "@/features/menu-management/lib/menu-utils";
import { NO_CATEGORY, type MenuData } from "@/features/menu-management/types";
import { MenuView, type MenuActions } from "./menu-view";

/** ข้อมูลตัวอย่างสำหรับ skeleton: โครงเหมือนหน้าจริง (หมวด + เมนูหลายแถว) */
const PLACEHOLDER: MenuData = {
  categories: [
    { id: "c1", name: "หมวดหมู่ตัวอย่าง", visible: true, sortOrder: 0 },
    { id: "c2", name: "หมวดหมู่ตัวอย่าง", visible: true, sortOrder: 1 },
  ],
  items: Array.from({ length: 5 }, (_, index) => ({
    id: `i${index}`,
    name: "ชื่อเมนูอาหารตัวอย่าง",
    description: "รายละเอียดเมนูตัวอย่างสั้นๆ",
    price: 100,
    image: "",
    available: true,
    featured: false,
    categoryId: index < 3 ? "c1" : "c2",
    sortOrder: index,
    optionGroups: [],
  })),
};

const NOOP_ACTIONS: MenuActions = {
  createItems: async () => undefined,
  updateItem: async () => undefined,
  deleteItem: async () => undefined,
  toggleAvailable: () => undefined,
  toggleFeatured: () => undefined,
  createCategory: async () => undefined,
  updateCategory: async () => undefined,
  deleteCategory: async () => undefined,
  reorderCategories: () => undefined,
  reorderItems: () => undefined,
};

/** หน้าจัดการเมนู: โหลดจาก API, อัปเดตสดเมื่อมีใครแก้เมนู และบันทึกทุกการแก้ไขทันที */
export function MenuWorkspace() {
  const { data, setData, error, reload } = useResource(menuApi.list, {
    refetchOn: [SocketEvent.MenuChanged],
  });

  const actions = useMemo<MenuActions>(() => {
    const update = (fn: (current: MenuData) => MenuData) =>
      setData((current) => (current ? fn(current) : current));

    /** บันทึกไม่สำเร็จ: แจ้งสาเหตุแล้วโหลดสถานะจริงจากเซิร์ฟเวอร์กลับมา */
    const rollback = (e: unknown) => {
      notify.error(e);
      reload();
    };

    return {
      async createItems(inputs) {
        const created = await menuApi.createItems(inputs);
        update((current) => ({ ...current, items: [...current.items, ...created] }));
        notify.success(created.length === 1 ? `เพิ่ม ${created[0].name} แล้ว` : `เพิ่ม ${created.length} เมนูแล้ว`);
      },

      async updateItem(id, input) {
        const item = await menuApi.updateItem(id, input);
        update((current) => ({
          ...current,
          items: current.items.map((existing) => (existing.id === id ? item : existing)),
        }));
        notify.success(`บันทึก ${item.name} แล้ว`);
      },

      async deleteItem(item) {
        try {
          await menuApi.deleteItem(item.id);
          update((current) => ({ ...current, items: current.items.filter((existing) => existing.id !== item.id) }));
          notify.success(`ลบ ${item.name} แล้ว`);
        } catch (e) {
          notify.error(e);
        }
      },

      toggleAvailable(item, available) {
        update((current) => ({
          ...current,
          items: current.items.map((existing) => (existing.id === item.id ? { ...existing, available } : existing)),
        }));
        menuApi.updateItem(item.id, { available }).then(
          () =>
            notify.success(
              available ? `เปิดขาย ${item.name} แล้ว` : `ปิดขาย ${item.name} ชั่วคราวแล้ว`,
              "ลูกค้าจะเห็นการเปลี่ยนแปลงบนหน้าสั่งอาหารทันที",
            ),
          rollback,
        );
      },

      toggleFeatured(item, featured) {
        update((current) => ({
          ...current,
          items: current.items.map((existing) => (existing.id === item.id ? { ...existing, featured } : existing)),
        }));
        menuApi.updateItem(item.id, { featured }).then(
          () =>
            notify.success(
              featured ? `แนะนำ ${item.name} แล้ว` : `เอา ${item.name} ออกจากเมนูแนะนำแล้ว`,
              featured ? "ลูกค้าจะเห็นเมนูนี้ที่ด้านบนสุดของหน้าสั่งอาหาร" : undefined,
            ),
          rollback,
        );
      },

      async createCategory({ name, visible }) {
        const category = await menuApi.createCategory(name, visible);
        update((current) => ({ ...current, categories: [...current.categories, category] }));
        notify.success(`เพิ่มหมวด ${category.name} แล้ว`);
      },

      async updateCategory(id, { name, visible }) {
        try {
          const category = await menuApi.updateCategory(id, name, visible);
          update((current) => ({
            ...current,
            categories: current.categories.map((existing) => (existing.id === id ? category : existing)),
          }));
        } catch (e) {
          notify.error(e);
          throw e;
        }
      },

      async deleteCategory(category, deleteItems) {
        try {
          await menuApi.deleteCategory(category.id, deleteItems);
          // ไม่ลบเมนู = เมนูย้ายไป "ไม่มีหมวดหมู่" ต่อท้าย โหลดลำดับจริงกลับมาให้ตรงกับเซิร์ฟเวอร์
          update((current) => ({
            categories: current.categories.filter((existing) => existing.id !== category.id),
            items: deleteItems
              ? current.items.filter((item) => item.categoryId !== category.id)
              : current.items.map((item) => (item.categoryId === category.id ? { ...item, categoryId: null } : item)),
          }));
          reload();
          notify.success(deleteItems ? `ลบหมวด ${category.name} และเมนูในหมวดแล้ว` : `ลบหมวด ${category.name} แล้ว`);
        } catch (e) {
          notify.error(e);
        }
      },

      reorderCategories(ids) {
        update((current) => reorderCategories(current, ids));
        menuApi.reorderCategories(ids).catch(rollback);
      },

      reorderItems(board) {
        update((current) => applyBoard(current, board));
        const baseline = data;
        // ส่งเฉพาะหมวดที่ลำดับเปลี่ยนจริง
        const changed = Object.entries(board).filter(([key, ids]) => {
          const before = baseline?.items
            .filter((item) => containerOf(item) === key)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((item) => item.id);
          return before?.join() !== ids.join();
        });
        Promise.all(
          changed.map(([key, ids]) => menuApi.reorderItems(key === NO_CATEGORY ? null : key, ids)),
        ).catch(rollback);
      },
    };
  }, [data, reload, setData]);

  if (!data) {
    if (error) {
      return (
        <Card role="alert" className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-danger text-sm">โหลดเมนูไม่สำเร็จ: {error}</p>
          <Button variant="outline" onClick={reload}>
            ลองใหม่
          </Button>
        </Card>
      );
    }
    return (
      <Skeleton>
        <MenuView data={PLACEHOLDER} actions={NOOP_ACTIONS} />
      </Skeleton>
    );
  }

  return <MenuView data={data} actions={actions} />;
}
