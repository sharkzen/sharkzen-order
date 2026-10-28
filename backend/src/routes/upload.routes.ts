import multipart from "@fastify/multipart";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { uploadImage } from "@/lib/storage.js";
import { AppError } from "@/utils/errors.js";
import { shopHandler } from "@/utils/route.js";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** menu = รูปเมนู (ไม่เกิน 1200px), cover = รูปปกร้าน (กว้างกว่า เพื่อให้คมบนแท็บเล็ต) */
const FOLDERS = { menu: 1200, cover: 1920 } as const;
const querySchema = z.object({ folder: z.enum(["menu", "cover"]).default("menu") });

export const uploadRoutes: FastifyPluginAsync = async (app) => {
  await app.register(multipart, { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } });

  /** อัปโหลดรูปเมนูหรือรูปปกร้าน (?folder=cover): รับ JPG/PNG/WebP แปลงเป็น WebP เก็บบน R2 แล้วคืน URL ให้เก็บใน MenuItem.image */
  app.post(
    "/image",
    { onRequest: [app.authenticate], config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    shopHandler(async ({ shopId, request }) => {
      const file = await request.file();
      if (!file) throw new AppError(400, "ไม่พบไฟล์รูป", "NO_FILE");
      const buffer = await file.toBuffer();
      if (file.file.truncated) throw new AppError(413, "รูปใหญ่เกิน 10 MB", "FILE_TOO_LARGE");
      const { folder } = querySchema.parse(request.query);
      return uploadImage(shopId, folder, buffer, FOLDERS[folder]);
    }),
  );
};
