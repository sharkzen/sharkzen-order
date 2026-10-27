import type { SettingsErrors, ShopSettings } from "../types";

const digits = (value: string) => value.replace(/\D/g, "");

/** ตรวจค่าที่กรอก คืน object ว่างเมื่อถูกต้องทั้งหมด (hours เป็น map ตามลำดับวัน) */
export function validateSettings(values: ShopSettings): SettingsErrors {
  const errors: SettingsErrors = { hours: {} };

  if (!values.name.trim()) errors.name = "กรอกชื่อร้าน";

  const phone = digits(values.phone);
  if (!phone) errors.phone = "กรอกเบอร์โทรของร้าน";
  else if (phone.length < 9 || phone.length > 10)
    errors.phone = "เบอร์โทรต้องมี 9–10 หลัก เช่น 032-123-456";

  if (values.acceptTransfer) {
    const id = digits(values.promptPayId);
    if (!id) errors.promptPayId = "กรอกเลขพร้อมเพย์เพื่อรับโอนเงิน";
    else if (id.length !== 10 && id.length !== 13)
      errors.promptPayId = "ใช้เบอร์โทร 10 หลัก หรือเลขประจำตัว 13 หลัก";
  }

  if (!values.acceptTransfer && !values.acceptCash && !values.acceptCounter) {
    errors.payment =
      "เปิดรับชำระอย่างน้อย 1 ช่องทาง ไม่เช่นนั้นลูกค้าจะจ่ายเงินไม่ได้";
  }

  const percent = values.serviceChargePercent;
  if (!Number.isFinite(percent) || percent < 0 || percent > 20) {
    errors.serviceCharge = "ใส่ค่าบริการ 0–20%";
  }

  values.hours.forEach((day, index) => {
    if (day.open && day.from >= day.to) {
      errors.hours[index] = "เวลาปิดต้องหลังเวลาเปิด";
    }
  });

  return errors;
}

export function hasErrors(errors: SettingsErrors) {
  return (
    Object.keys(errors.hours).length > 0 ||
    Object.entries(errors).some(([key, value]) => key !== "hours" && !!value)
  );
}
