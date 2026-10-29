/** รูปแบบ response มาตรฐานจาก backend (ปรับตามจริงเมื่อ backend เสร็จ) */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiErrorBody {
  message?: string;
  /** รหัสให้ตัดสินใจต่อ เช่น EMAIL_NOT_VERIFIED, OTP_LOCKED */
  code?: string;
  /** เหตุผลที่ผู้ดูแลระบบระบุตอนแบน/ระงับ (มากับ ACCOUNT_BANNED, SHOP_SUSPENDED) */
  reason?: string;
  errors?: Record<string, string[]>;
}
