import type { Category, MenuItem } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";
import { deleteImage, isOwnImage } from "@/lib/storage.js";
import { MAX_FEATURED, optionGroupsSchema } from "@/schemas/menu.schema.js";
import type {
  CategoryBody,
  MenuItemBody,
  MenuItemPatch,
} from "@/schemas/menu.schema.js";
import { AppError, notFound } from "@/utils/errors.js";

const itemDto = (item: MenuItem) => ({
  id: item.id,
  name: item.name,
  description: item.description,
  price: Number(item.price),
  image: item.image,
  available: item.available,
  featured: item.featured,
  categoryId: item.categoryId,
  sortOrder: item.sortOrder,
  optionGroups: optionGroupsSchema.catch([]).parse(item.optionGroups),
});

const categoryDto = (category: Category) => ({
  id: category.id,
  name: category.name,
  visible: category.visible,
  sortOrder: category.sortOrder,
});

/** รูปต้องเป็น URL ที่ระบบอัปโหลดให้ร้านนี้เอง (หรือว่าง) */
function assertImage(shopId: string, image: string | undefined) {
  if (image && !isOwnImage(shopId, image)) {
    throw new AppError(400, "รูปไม่ถูกต้อง กรุณาอัปโหลดรูปใหม่", "INVALID_IMAGE_URL");
  }
}

async function assertCategory(shopId: string, categoryId: string | null | undefined) {
  if (!categoryId) return;
  const found = await prisma.category.findFirst({ where: { id: categoryId, shopId } });
  if (!found) throw new AppError(400, "ไม่พบหมวดหมู่นี้", "CATEGORY_NOT_FOUND");
}

/** ลำดับถัดไปท้ายสุดของหมวด (เมนูใหม่ต่อท้ายเสมอ) */
async function nextItemOrder(shopId: string, categoryId: string | null) {
  const last = await prisma.menuItem.aggregate({
    where: { shopId, categoryId, deletedAt: null },
    _max: { sortOrder: true },
  });
  return (last._max.sortOrder ?? -1) + 1;
}

/** ลบเมนู: ที่ยังไม่เคยถูกสั่งลบจริง ที่เคยถูกสั่งแล้วซ่อนไว้แทน (ประวัติออเดอร์ไม่เสีย) แล้วลบรูปบน R2 */
async function removeItems(shopId: string, items: MenuItem[]) {
  if (items.length === 0) return;
  const ids = items.map((item) => item.id);
  const used = new Set(
    (await prisma.orderItem.findMany({ where: { menuItemId: { in: ids } }, select: { menuItemId: true }, distinct: ["menuItemId"] })).map(
      (row) => row.menuItemId,
    ),
  );
  const unused = ids.filter((id) => !used.has(id));
  await prisma.$transaction([
    prisma.menuItem.deleteMany({ where: { id: { in: unused } } }),
    prisma.menuItem.updateMany({
      where: { id: { in: ids.filter((id) => used.has(id)) } },
      data: { deletedAt: new Date(), categoryId: null, image: "", available: false, featured: false },
    }),
  ]);
  for (const item of items) if (item.image) deleteImage(shopId, item.image);
}

export const menuService = {
  /** เมนูทั้งหมดของร้าน เรียงตามหมวดและลำดับที่เจ้าของจัดไว้ */
  async list(shopId: string) {
    const [categories, items] = await Promise.all([
      prisma.category.findMany({ where: { shopId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
      prisma.menuItem.findMany({ where: { shopId, deletedAt: null }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    ]);
    return { categories: categories.map(categoryDto), items: items.map(itemDto) };
  },

  async createCategory(shopId: string, { name, visible }: CategoryBody) {
    const exists = await prisma.category.findUnique({ where: { shopId_name: { shopId, name } } });
    if (exists) throw new AppError(409, "มีหมวดหมู่ชื่อนี้อยู่แล้ว", "DUPLICATE_CATEGORY");
    const last = await prisma.category.aggregate({ where: { shopId }, _max: { sortOrder: true } });
    const category = await prisma.category.create({
      data: { shopId, name, visible: visible ?? true, sortOrder: (last._max.sortOrder ?? -1) + 1 },
    });
    return categoryDto(category);
  },

  async updateCategory(shopId: string, id: string, { name, visible }: CategoryBody) {
    const current = await prisma.category.findFirst({ where: { id, shopId } });
    if (!current) throw notFound("Category");
    if (name !== current.name) {
      const dup = await prisma.category.findUnique({ where: { shopId_name: { shopId, name } } });
      if (dup) throw new AppError(409, "มีหมวดหมู่ชื่อนี้อยู่แล้ว", "DUPLICATE_CATEGORY");
    }
    return categoryDto(
      await prisma.category.update({ where: { id }, data: { name, visible: visible ?? current.visible } }),
    );
  },

  /**
   * ลบหมวด: ปกติเมนูในหมวดไม่ถูกลบ แต่ย้ายไป "ไม่มีหมวดหมู่" ต่อท้ายลำดับเดิม
   * deleteItems = ลบเมนูทั้งหมดในหมวดด้วย (เมนูที่เคยถูกสั่งแล้วเก็บแถวไว้ให้ประวัติออเดอร์ แต่ไม่แสดงอีก)
   */
  async deleteCategory(shopId: string, id: string, deleteItems = false) {
    const category = await prisma.category.findFirst({ where: { id, shopId } });
    if (!category) throw notFound("Category");
    const items = await prisma.menuItem.findMany({
      where: { categoryId: id, deletedAt: null },
      orderBy: { sortOrder: "asc" },
    });

    if (deleteItems) {
      await removeItems(shopId, items);
      await prisma.category.delete({ where: { id } });
      return;
    }

    const base = await nextItemOrder(shopId, null);
    await prisma.$transaction([
      ...items.map((item, index) =>
        prisma.menuItem.update({ where: { id: item.id }, data: { categoryId: null, sortOrder: base + index } }),
      ),
      prisma.category.delete({ where: { id } }),
    ]);
  },

  async reorderCategories(shopId: string, ids: string[]) {
    const owned = await prisma.category.findMany({ where: { shopId }, select: { id: true } });
    const known = new Set(owned.map((c) => c.id));
    if (ids.some((id) => !known.has(id))) throw new AppError(400, "รายการหมวดหมู่ไม่ถูกต้อง");
    await prisma.$transaction(
      ids.map((id, index) => prisma.category.update({ where: { id }, data: { sortOrder: index } })),
    );
  },

  async createItem(shopId: string, body: MenuItemBody) {
    assertImage(shopId, body.image);
    await assertCategory(shopId, body.categoryId);
    const item = await prisma.menuItem.create({
      data: { ...body, shopId, sortOrder: await nextItemOrder(shopId, body.categoryId) },
    });
    return itemDto(item);
  },

  async createItems(shopId: string, bodies: MenuItemBody[]) {
    for (const body of bodies) {
      assertImage(shopId, body.image);
      await assertCategory(shopId, body.categoryId);
    }
    // ต่อท้ายลำดับของแต่ละหมวดตามลำดับที่ส่งมา
    const next = new Map<string | null, number>();
    const created = await prisma.$transaction(async (tx) => {
      const rows: MenuItem[] = [];
      for (const body of bodies) {
        const key = body.categoryId;
        if (!next.has(key)) {
          const last = await tx.menuItem.aggregate({
            where: { shopId, categoryId: key, deletedAt: null },
            _max: { sortOrder: true },
          });
          next.set(key, (last._max.sortOrder ?? -1) + 1);
        }
        const sortOrder = next.get(key) as number;
        next.set(key, sortOrder + 1);
        rows.push(await tx.menuItem.create({ data: { ...body, shopId, sortOrder } }));
      }
      return rows;
    });
    return created.map(itemDto);
  },

  async updateItem(shopId: string, id: string, patch: MenuItemPatch) {
    const current = await prisma.menuItem.findFirst({ where: { id, shopId, deletedAt: null } });
    if (!current) throw notFound("Menu item");
    // รูปที่ไม่เปลี่ยน (URL เดิม) ผ่านได้แม้ R2 ถูกตั้งค่าใหม่ภายหลัง
    if (patch.image !== current.image) assertImage(shopId, patch.image);
    await assertCategory(shopId, patch.categoryId);
    if (patch.featured && !current.featured) {
      const featured = await prisma.menuItem.count({ where: { shopId, featured: true, deletedAt: null } });
      if (featured >= MAX_FEATURED) {
        throw new AppError(400, `แนะนำได้ไม่เกิน ${MAX_FEATURED} เมนู กรุณายกเลิกเมนูอื่นก่อน`, "FEATURED_LIMIT");
      }
    }
    const moved = patch.categoryId !== undefined && patch.categoryId !== current.categoryId;
    const item = await prisma.menuItem.update({
      where: { id },
      data: { ...patch, ...(moved && { sortOrder: await nextItemOrder(shopId, patch.categoryId ?? null) }) },
    });
    if (current.image && patch.image !== undefined && patch.image !== current.image) {
      deleteImage(shopId, current.image);
    }
    return itemDto(item);
  },

  /** ลบเมนู: ถ้าเคยถูกสั่งแล้วจะซ่อนแทน เพื่อไม่ให้ประวัติออเดอร์เสีย */
  async deleteItem(shopId: string, id: string) {
    const current = await prisma.menuItem.findFirst({ where: { id, shopId, deletedAt: null } });
    if (!current) throw notFound("Menu item");
    await removeItems(shopId, [current]);
  },

  async reorderItems(shopId: string, categoryId: string | null, ids: string[]) {
    await assertCategory(shopId, categoryId);
    const owned = await prisma.menuItem.findMany({
      where: { shopId, id: { in: ids }, deletedAt: null },
      select: { id: true },
    });
    if (owned.length !== ids.length) throw new AppError(400, "รายการเมนูไม่ถูกต้อง");
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.menuItem.update({ where: { id }, data: { categoryId, sortOrder: index } }),
      ),
    );
  },
};
