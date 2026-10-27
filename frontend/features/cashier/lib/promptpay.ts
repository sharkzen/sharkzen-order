/**
 * สร้างข้อความ PromptPay QR (มาตรฐาน EMVCo / Thai QR Payment) แบบระบุยอดเงิน
 * รองรับเบอร์โทร 10 หลัก และเลขประจำตัว 13 หลัก
 * หมายเหตุ: ใช้แสดงให้ลูกค้าสแกนเท่านั้น ระบบยังยืนยันยอดเข้าบัญชีเองไม่ได้
 * จนกว่าจะเชื่อมผู้ให้บริการชำระเงิน (เช่น Stripe) แคชเชียร์ต้องตรวจในแอปธนาคารแล้วกดยืนยันเอง
 */
function field(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

function crc16(text: string) {
  let crc = 0xffff;
  for (let i = 0; i < text.length; i += 1) {
    crc ^= text.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function buildPromptPayPayload(target: string, amount: number) {
  const digits = target.replace(/\D/g, "");
  const isPhone = digits.length <= 10;
  const account = isPhone
    ? field("01", `0066${digits.replace(/^0/, "")}`)
    : field("02", digits);

  const body =
    field("00", "01") +
    field("01", "12") + // 12 = QR แบบใช้ครั้งเดียว (ระบุยอด)
    field("29", field("00", "A000000677010111") + account) +
    field("53", "764") +
    field("54", amount.toFixed(2)) +
    field("58", "TH") +
    "6304";
  return body + crc16(body);
}
