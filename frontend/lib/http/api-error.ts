import { isAxiosError } from "axios";
import type { ApiErrorBody } from "@/types/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly fieldErrors?: Record<string, string[]>,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const FALLBACK_MESSAGE = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";

/** แปลง error ใดๆ ให้เป็น ApiError ที่มีข้อความพร้อมแสดงผล */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return new ApiError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
    const { status, data } = error.response;
    return new ApiError(
      data?.message ?? FALLBACK_MESSAGE,
      status,
      data?.errors,
      data?.code,
    );
  }

  return new ApiError(
    error instanceof Error ? error.message : FALLBACK_MESSAGE,
  );
}
