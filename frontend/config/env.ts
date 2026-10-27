export const env = {
  /** Base URL ของ backend API (ใช้ได้ทั้ง server และ client) */
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api",
  /** URL ของเว็บเอง ใช้สำหรับ metadata / sitemap */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;
