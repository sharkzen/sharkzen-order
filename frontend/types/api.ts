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
  errors?: Record<string, string[]>;
}
