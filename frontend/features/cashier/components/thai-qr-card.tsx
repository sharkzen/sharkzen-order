import { formatNumber } from "@/features/dashboard/lib/format";
import { QrCode } from "@/features/table-management/components/qr-code";

interface ThaiQrCardProps {
  /** ข้อความ PromptPay QR ที่ระบุยอดแล้ว */
  payload: string;
  amount: number;
  shopName: string;
}

/**
 * บัตร QR ตามรูปแบบ Thai QR Payment: แถบหัวสีน้ำเงินเข้ม → เครื่องหมายพร้อมเพย์ → คิวอาร์โค้ด → ชื่อร้านและยอด
 * หมายเหตุ: เครื่องหมาย THAI QR PAYMENT และ PromptPay ในที่นี้เป็นตัวอักษรแทนชั่วคราว
 * ก่อนใช้งานจริงให้เปลี่ยนเป็นไฟล์โลโก้ทางการตามแนวทางของธนาคารแห่งประเทศไทย
 */
export function ThaiQrCard({ payload, amount, shopName }: ThaiQrCardProps) {
  return (
    <div className="border-border mx-auto w-full max-w-[300px] overflow-hidden rounded-xl border bg-white text-[#0f2d5c] shadow-sm">
      <div className="flex items-center justify-center gap-2.5 bg-[#143a73] px-4 py-3 text-white">
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-md bg-white text-[#143a73]"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
            <path d="M3 3h8v8H3V3Zm2 2v4h4V5H5Zm8-2h8v8h-8V3Zm2 2v4h4V5h-4ZM3 13h8v8H3v-8Zm2 2v4h4v-4H5Zm8-2h3v3h-3v-3Zm5 0h3v3h-3v-3Zm-5 5h3v3h-3v-3Zm5 0h3v3h-3v-3Z" />
          </svg>
        </span>
        <span className="flex flex-col text-left leading-none font-bold tracking-wide">
          <span className="text-[15px]">THAI QR</span>
          <span className="text-[15px]">PAYMENT</span>
        </span>
      </div>

      <div className="flex flex-col items-center gap-3 px-5 pt-4 pb-5">
        <span className="flex items-center gap-1.5 rounded-md border-2 border-[#143a73] px-2.5 py-1 leading-none">
          <span className="text-[17px] font-extrabold text-[#143a73]">
            Prompt
          </span>
          <span className="text-[17px] font-extrabold text-[#2a8fd1]">Pay</span>
          <span className="ml-1 text-[9px] font-semibold text-[#143a73]">
            พร้อมเพย์
          </span>
        </span>

        <QrCode
          value={payload}
          label={`คิวอาร์โค้ดพร้อมเพย์ ยอด ${formatNumber(amount)} บาท`}
          className="aspect-square w-full max-w-[220px]"
        />

        <div className="flex flex-col items-center gap-0.5 text-center">
          <p className="text-sm font-semibold">{shopName}</p>
          <p className="font-display text-[34px] leading-none font-semibold tabular-nums">
            ฿{formatNumber(amount)}
          </p>
        </div>
      </div>
    </div>
  );
}
