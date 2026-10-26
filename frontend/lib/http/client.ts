"use client";

import { createHttp } from "./create-http";

/** ใช้ใน Client Component เท่านั้น (event handler, form submit, mutation) */
export const clientHttp = createHttp({ withCredentials: true });
