export interface DayHours {
  open: boolean;
  /** เวลาเปิด รูปแบบ HH:mm */
  from: string;
  /** เวลาปิด รูปแบบ HH:mm */
  to: string;
}

export interface ShopSettings {
  name: string;
  branch: string;
  phone: string;
  address: string;
  /** URL รูปปกร้าน "" = ไม่มี */
  coverImage: string;
  /** เรียงจันทร์ถึงอาทิตย์ */
  hours: DayHours[];
  acceptOrders: boolean;
  /** ต้องชำระเงินก่อนออเดอร์จึงเข้าครัว */
  payBeforeKitchen: boolean;
  acceptTransfer: boolean;
  acceptCash: boolean;
  acceptCounter: boolean;
  /** เลขพร้อมเพย์ (เบอร์โทร 10 หลัก หรือเลขประจำตัว 13 หลัก) */
  promptPayId: string;
  /** ชื่อบัญชีพร้อมเพย์ */
  promptPayTitle: string;
  promptPayFirstName: string;
  promptPayLastName: string;
  serviceChargePercent: number;
  vatIncluded: boolean;
  newOrderSound: boolean;
  newOrderPopup: boolean;
  dailySummary: boolean;
}

export type SettingsErrors = Partial<
  Record<"name" | "phone" | "promptPayId" | "promptPayName" | "serviceCharge" | "payment", string>
> & { hours: Record<number, string> };
