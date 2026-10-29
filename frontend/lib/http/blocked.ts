import type { ApiError } from "./api-error";

/** event ที่ยิงเมื่อ API ตอบว่าบัญชี/ร้านถูกผู้ดูแลระบบระงับ ให้หน้าต่างแจ้งสถานะ (BlockedModal) ฟัง */
export const BLOCKED_EVENT = "sz:blocked";

export interface BlockedDetail {
  code: "ACCOUNT_BANNED" | "SHOP_SUSPENDED";
  message: string;
  reason: string;
}

/** เรียกจาก interceptor ทุก request: เฉพาะ error ที่เกิดจากการถูกระงับเท่านั้นที่ถูกประกาศ */
export function announceBlocked(error: ApiError) {
  if (typeof window === "undefined") return;
  if (error.code !== "ACCOUNT_BANNED" && error.code !== "SHOP_SUSPENDED") return;
  window.dispatchEvent(
    new CustomEvent<BlockedDetail>(BLOCKED_EVENT, {
      detail: { code: error.code, message: error.message, reason: error.reason ?? "" },
    }),
  );
}
