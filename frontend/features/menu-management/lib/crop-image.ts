export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MAX_SIDE = 1600;

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("เปิดรูปนี้ไม่ได้ กรุณาเลือกไฟล์ JPG, PNG หรือ WebP"));
    img.src = url;
  });
}

/**
 * ตัดรูปตามกรอบที่ผู้ใช้เลือก (หน่วยพิกเซลของรูปต้นฉบับ) เป็นไฟล์ JPEG คุณภาพสูง
 * server จะแปลงเป็น WebP อีกรอบตอนอัปโหลด จึงไม่ต้องบีบมากที่นี่ รูปโปร่งใสจะได้พื้นขาว
 */
export async function cropToBlob(imageUrl: string, crop: PixelCrop, maxSide = MAX_SIDE) {
  const img = await loadImage(imageUrl);
  const scale = Math.min(1, maxSide / Math.max(crop.width, crop.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(crop.width * scale));
  canvas.height = Math.max(1, Math.round(crop.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("เบราว์เซอร์นี้ประมวลผลรูปไม่ได้");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("ตัดรูปไม่สำเร็จ"))), "image/jpeg", 0.92),
  );
}
