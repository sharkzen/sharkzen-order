import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().min(1),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default("SHARKZEN ORDER <no-reply@sharkzen.local>"),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  // Cloudflare R2 (เก็บรูปเมนู) ไม่ตั้ง = อัปโหลดรูปไม่ได้ แต่ระบบส่วนอื่นยังทำงานปกติ
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  /** URL สาธารณะของ bucket เช่น https://img.example.com (ไม่มี / ท้าย) */
  R2_PUBLIC_URL: z
    .string()
    .optional()
    .transform((value) => value?.replace(/\/+$/, "")),
  /** IP/CIDR ที่เข้า /api/admin ได้ คั่นด้วย , ว่าง = ไม่จำกัด (production ควรตั้งเสมอ) */
  ADMIN_IP_ALLOWLIST: z
    .string()
    .default("")
    .transform((value) => value.split(",").map((entry) => entry.trim()).filter(Boolean)),
  /** บังคับผู้ดูแลระบบต้องเปิด 2FA (TOTP) ก่อนใช้งาน ค่าเริ่มต้น: บังคับเฉพาะ production */
  ADMIN_REQUIRE_2FA: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  /** เชื่อ X-Forwarded-For จาก reverse proxy (ตั้ง true เมื่ออยู่หลัง nginx/Cloudflare) เพื่อให้ IP จริงถูกต้อง */
  TRUST_PROXY: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:3000")
    .transform((value) => value.split(",").map((origin) => origin.trim())),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  ADMIN_REQUIRE_2FA: parsed.data.ADMIN_REQUIRE_2FA ?? parsed.data.NODE_ENV === "production",
};
