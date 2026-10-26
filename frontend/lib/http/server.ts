import { createHttp } from "./create-http";

/**
 * ใช้ใน Server Component / Route Handler / Server Action
 * ตัวอย่าง: const { data } = await serverHttp.get("/orders")
 *
 * ถ้าต้องส่ง cookie/token ของผู้ใช้ไป backend ให้สร้าง instance ใหม่
 * ด้วย createHttp({ headers: { Authorization: ... } }) ต่อ request
 */
export const serverHttp = createHttp();
