export const env = {
  /** Base URL ของ backend API (ใช้ได้ทั้ง server และ client) */
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api",
  /** URL ของเว็บเอง ใช้สำหรับ metadata / sitemap */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** origin ของ backend สำหรับ Socket.IO (ตัด /api ท้าย apiUrl ออก) */
  socketUrl: new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api").origin,
} as const;
