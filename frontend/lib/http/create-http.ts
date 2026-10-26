import axios, { type AxiosInstance, type CreateAxiosDefaults } from "axios";
import { env } from "@/config/env";
import { toApiError } from "./api-error";

/**
 * สร้าง axios instance พร้อม interceptor มาตรฐาน
 * error ทุกตัวที่ throw ออกมาจะเป็น ApiError เสมอ
 */
export function createHttp(config: CreateAxiosDefaults = {}): AxiosInstance {
  const instance = axios.create({
    baseURL: env.apiUrl,
    timeout: 10_000,
    headers: { "Content-Type": "application/json" },
    ...config,
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: unknown) => Promise.reject(toApiError(error)),
  );

  return instance;
}
