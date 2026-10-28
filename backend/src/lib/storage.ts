import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { env } from "@/config/env.js";
import { AppError } from "@/utils/errors.js";

const DEFAULT_MAX_SIDE = 1200;
const WEBP_QUALITY = 80;

const configured = Boolean(
  env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET && env.R2_PUBLIC_URL,
);

const client = configured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: env.R2_ACCESS_KEY_ID!, secretAccessKey: env.R2_SECRET_ACCESS_KEY! },
    })
  : null;

function requireClient() {
  if (!client) {
    throw new AppError(503, "ยังไม่ได้ตั้งค่า R2 สำหรับเก็บรูป (ดู R2_* ใน .env)", "STORAGE_NOT_CONFIGURED");
  }
  return client;
}

/** ย่อรูปไม่เกิน maxSide พิกเซลแล้วแปลงเป็น WebP (หมุนตาม EXIF และตัด metadata ทิ้ง) */
export async function toWebp(input: Buffer, maxSide = DEFAULT_MAX_SIDE) {
  try {
    return await sharp(input, { failOn: "error" })
      .rotate()
      .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch {
    throw new AppError(400, "ไฟล์นี้ไม่ใช่รูปภาพที่เปิดได้ ใช้ JPG, PNG หรือ WebP", "INVALID_IMAGE");
  }
}

/** แปลงเป็น WebP แล้วอัปโหลดขึ้น R2 คืน URL สาธารณะ (key ใหม่ทุกครั้ง จึงแคชได้ตลอด) */
export async function uploadImage(shopId: string, folder: string, input: Buffer, maxSide?: number) {
  const s3 = requireClient();
  const body = await toWebp(input, maxSide);
  const key = `shops/${shopId}/${folder}/${randomUUID()}.webp`;
  await s3.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return { url: `${env.R2_PUBLIC_URL}/${key}`, bytes: body.length };
}

/** URL นี้เป็นรูปของร้านนี้บน R2 ของเราหรือไม่ (กันไม่ให้ใส่ URL ภายนอกหรือของร้านอื่น) */
export const isOwnImage = (shopId: string, url: string) =>
  configured && url.startsWith(`${env.R2_PUBLIC_URL}/shops/${shopId}/`);

/** ลบรูปเก่าออกจาก R2 แบบไม่รอผลและไม่ทำให้คำขอหลักล้มเหลว (รูปค้างอยู่ก็ไม่กระทบการทำงาน) */
export function deleteImage(shopId: string, url: string) {
  if (!client || !isOwnImage(shopId, url)) return;
  const key = url.slice(env.R2_PUBLIC_URL!.length + 1);
  client.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key: key })).catch(() => undefined);
}
