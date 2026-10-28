import { clientHttp } from "@/lib/http/client";
import type {
  Category,
  MenuData,
  MenuItem,
  MenuItemInput,
} from "@/features/menu-management/types";

/** อัปโหลดรูปเมนู: server แปลงเป็น WebP เก็บบน R2 แล้วคืน URL (เก็บใน MenuItem.image) */
export const uploadMenuImage = (image: Blob) => {
  const form = new FormData();
  form.append("file", image, "menu.jpg");
  return clientHttp
    .post<{ url: string }>("/uploads/image", form, { timeout: 60_000, headers: { "Content-Type": "multipart/form-data" } })
    .then((res) => res.data.url);
};

export const menuApi = {
  list: (signal?: AbortSignal) =>
    clientHttp.get<MenuData>("/menu", { signal }).then((res) => res.data),

  createCategory: (name: string, visible: boolean) =>
    clientHttp.post<Category>("/menu/categories", { name, visible }).then((res) => res.data),
  updateCategory: (id: string, name: string, visible: boolean) =>
    clientHttp.patch<Category>(`/menu/categories/${id}`, { name, visible }).then((res) => res.data),
  /** deleteItems = ลบเมนูทั้งหมดในหมวดด้วย (ไม่ส่ง = ย้ายไป "ไม่มีหมวดหมู่") */
  deleteCategory: (id: string, deleteItems: boolean) =>
    clientHttp.delete(`/menu/categories/${id}`, { params: { deleteItems } }),
  reorderCategories: (ids: string[]) => clientHttp.put("/menu/categories/order", { ids }),

  createItems: (items: MenuItemInput[]) =>
    clientHttp.post<MenuItem[]>("/menu/items/bulk", { items }).then((res) => res.data),
  updateItem: (id: string, patch: Partial<MenuItemInput>) =>
    clientHttp.patch<MenuItem>(`/menu/items/${id}`, patch).then((res) => res.data),
  deleteItem: (id: string) => clientHttp.delete(`/menu/items/${id}`),
  /** ลำดับเมนูในหมวดหนึ่ง เมนูที่ย้ายมาจากหมวดอื่นจะเปลี่ยนหมวดตาม */
  reorderItems: (categoryId: string | null, ids: string[]) =>
    clientHttp.put("/menu/items/order", { categoryId, ids }),
};
