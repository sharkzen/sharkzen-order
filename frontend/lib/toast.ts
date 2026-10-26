"use client";

import { toast } from "sharkzen-toast";
import { toApiError } from "@/lib/http/api-error";

/** helper สำหรับแจ้งเตือน เรียกจาก Client Component / event handler เท่านั้น */
export const notify = {
  success: (title: string, description?: string) =>
    toast.success(title, { description }),
  info: (title: string, description?: string) =>
    toast.info(title, { description }),
  warning: (title: string, description?: string) =>
    toast.warning(title, { description }),
  /** รับ error ใดๆ แล้วแสดงข้อความที่เหมาะสมให้เอง */
  error: (error: unknown, fallback?: string) =>
    toast.error(fallback ?? toApiError(error).message),
};

export { toast };
