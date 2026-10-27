function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("เปิดรูปนี้ไม่ได้ กรุณาเลือกไฟล์ JPG หรือ PNG"));
    img.src = url;
  });
}

/** อ่านไฟล์รูปแล้วย่อด้านยาวไม่เกิน maxSide พิกเซล คืนเป็น data URL (JPEG) พร้อมเก็บหรือแสดงผล */
export async function readImage(file: File, maxSide = 1600) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("เบราว์เซอร์นี้ประมวลผลรูปไม่ได้");
    ctx.fillStyle = "#fff"; // รูป PNG โปร่งใสจะได้พื้นขาวแทนดำ
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
