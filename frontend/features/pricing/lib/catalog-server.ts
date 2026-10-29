import type { Catalog } from "@/features/landing/data";
import { env } from "@/config/env";

/** ดึงราคาฝั่ง server (แคช 1 นาที) ใช้กับหน้าที่ต้องการ SEO เช่น หน้าแรก; ดึงไม่ได้ = null */
export async function fetchCatalog(): Promise<Catalog | null> {
  try {
    const response = await fetch(`${env.apiUrl}/public/plans`, { next: { revalidate: 60 } });
    return response.ok ? ((await response.json()) as Catalog) : null;
  } catch {
    return null;
  }
}
