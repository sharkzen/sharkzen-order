import { PiCheckCircleFill, PiClipboardTextFill, PiShoppingCartSimpleFill } from "react-icons/pi";
import { Button, Dialog } from "@/components/ui";
import type { ResolvedLine } from "@/features/customer-order/lib/cart";
import { baht } from "@/features/customer-order/lib/format";
import { QuantityStepper } from "./quantity-stepper";

interface ConfirmOrderDialogProps {
  open: boolean;
  lines: ResolvedLine[];
  total: number;
  loading: boolean;
  /** ปรับจำนวนในหน้านี้ได้เลย (ลดเหลือ 0 = เอาออก) */
  onChange: (key: string, quantity: number) => void;
  onConfirm: () => void;
  onClose: () => void;
}

/** ยืนยันอีกครั้งก่อนส่งออเดอร์เข้าครัวจริง (ส่งแล้วครัวเห็นทันที) */
export function ConfirmOrderDialog({ open, lines, total, loading, onChange, onConfirm, onClose }: ConfirmOrderDialogProps) {
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <Dialog
      open={open}
      title="ยืนยันการสั่งอาหาร"
      onClose={() => !loading && onClose()}
      className="bg-primary-soft w-[min(94vw,480px)] rounded-3xl"
    >
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-center gap-4 pr-10">
          <span className="bg-surface text-primary relative flex size-16 shrink-0 items-center justify-center rounded-full">
            <PiClipboardTextFill className="size-8" aria-hidden />
            <PiCheckCircleFill className="text-primary bg-surface absolute right-1 bottom-1 size-5 rounded-full" aria-hidden />
          </span>
          <div>
            <p aria-hidden className="font-display text-foreground text-xl leading-tight font-bold">
              ยืนยันการสั่งอาหาร
            </p>
            <p className="text-muted-foreground mt-1 text-sm leading-snug">
              ตรวจสอบรายการอาหารและจำนวนอีกครั้ง ก่อนยืนยันการสั่งซื้อ
            </p>
          </div>
        </div>

        <div className="bg-surface flex flex-col gap-3 rounded-2xl p-3">
          <ul className="scroll-thin divide-border max-h-[42dvh] divide-y overflow-y-auto">
            {lines.map(({ key, item, optionNames, unitPrice, quantity }) => (
              <li key={key} className="flex items-center gap-3 py-3 first:pt-1">
                <div className="bg-muted size-14 shrink-0 overflow-hidden rounded-xl">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="size-full object-contain" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="text-foreground text-sm leading-snug font-bold">{item.name}</p>
                  {optionNames.length > 0 && (
                    <p className="text-muted-foreground text-[11px] leading-snug">{optionNames.join(" • ")}</p>
                  )}
                  <p className="text-primary-strong text-sm font-bold tabular-nums">{baht(unitPrice)}</p>
                </div>
                <QuantityStepper
                  variant="pill"
                  quantity={quantity}
                  name={item.name}
                  onChange={(q) => onChange(key, q)}
                  className="shrink-0"
                />
                <span className="text-foreground w-14 shrink-0 text-right text-xs font-semibold tabular-nums">
                  {baht(unitPrice * quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="border-border flex items-center justify-between border-t px-1 pt-3">
            <span className="text-muted-foreground text-sm">รวม {count} รายการ</span>
            <span className="font-display text-foreground text-2xl font-bold tabular-nums">{baht(total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="lg" onClick={onClose} disabled={loading} className="rounded-full">
            ยกเลิก
          </Button>
          <Button size="lg" loading={loading} onClick={onConfirm} className="rounded-full">
            {!loading && <PiShoppingCartSimpleFill className="size-5" aria-hidden />}
            ยืนยันสั่งอาหาร
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
