import { Plus, SlidersHorizontal } from "lucide-react";
import { buttonVariants } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { CustomerMenuItem } from "@/features/customer-order/lib/customer-api";
import { baht } from "@/features/customer-order/lib/format";
import { QuantityStepper } from "./quantity-stepper";

interface MenuCardProps {
  item: CustomerMenuItem;
  /** จำนวนของเมนูนี้ในตะกร้า (รวมทุกตัวเลือก) */
  quantity: number;
  /** false = ตอนนี้สั่งไม่ได้ แตะแล้วจะเปิดหน้าต่างแจ้งให้เรียกพนักงาน */
  canOrder: boolean;
  /** เมนูที่ไม่มีตัวเลือก: ปรับจำนวนตรงๆ */
  onChange: (quantity: number) => void;
  /** เมนูที่มีตัวเลือก: เปิดหน้าเลือกตัวเลือกเต็มจอ */
  onChoose: () => void;
  onBlocked: () => void;
}

/**
 * การ์ดเมนู: แตะตรงไหนก็ได้ (รูป ชื่อ ราคา ปุ่ม) = เพิ่มลงตะกร้า หรือเปิดหน้าเลือกตัวเลือกถ้าเมนูมีตัวเลือก
 * ปุ่มโปร่งใสคลุมทั้งการ์ดไว้ด้านหลัง ส่วนตัวปรับจำนวนลอยอยู่ด้านหน้าจึงกดแยกได้
 */
export function MenuCard({ item, quantity, canOrder, onChange, onChoose, onBlocked }: MenuCardProps) {
  const soldOut = !item.available;
  const hasOptions = item.optionGroups.length > 0;

  function activate() {
    if (!canOrder) return onBlocked();
    if (hasOptions) return onChoose();
    onChange(quantity + 1);
  }

  return (
    <li
      className={cn(
        "bg-surface group relative isolate flex flex-col gap-3 rounded-xl border p-3 transition-colors",
        quantity > 0 ? "border-primary ring-primary ring-1" : "border-border",
        !soldOut && "hover:border-primary/60",
      )}
    >
      {!soldOut && (
        <button
          type="button"
          onClick={activate}
          aria-label={hasOptions ? `เลือกตัวเลือก ${item.name}` : `เพิ่ม ${item.name} ลงตะกร้า`}
          className="focus-visible:ring-primary/50 absolute inset-0 z-0 cursor-pointer rounded-xl focus-visible:ring-2 focus-visible:outline-none"
        />
      )}

      <div className="pointer-events-none flex flex-1 flex-col gap-3">
        <div
          className={cn(
            "bg-muted text-muted-foreground flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg",
            soldOut && "opacity-50 grayscale",
          )}
        >
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            <span className="text-xs font-medium">ยังไม่มีรูป</span>
          )}
        </div>

        <div className={cn("flex flex-1 flex-col gap-1.5 px-0.5", soldOut && "opacity-60")}>
          <h3 className="text-foreground text-[15px] leading-snug font-semibold">{item.name}</h3>
          {item.description && (
            <p className="text-muted-foreground line-clamp-2 text-[13px] leading-relaxed">{item.description}</p>
          )}
          <p className="text-primary-strong mt-auto pt-1.5 text-[17px] leading-none font-bold tabular-nums">
            {baht(item.price)}
            {hasOptions && <span className="text-muted-foreground ml-1 text-xs font-medium">เริ่มต้น</span>}
          </p>
        </div>
      </div>

      {soldOut ? (
        <span className={cn(buttonVariants({ variant: "outline" }), "pointer-events-none w-full opacity-50")}>
          หมดชั่วคราว
        </span>
      ) : quantity > 0 && !hasOptions ? (
        <QuantityStepper quantity={quantity} name={item.name} onChange={onChange} className="relative z-10" />
      ) : (
        <span
          className={cn(
            buttonVariants({ variant: quantity > 0 ? "primary" : "secondary" }),
            "pointer-events-none w-full",
          )}
        >
          {hasOptions ? (
            <SlidersHorizontal className="size-[18px]" aria-hidden />
          ) : (
            <Plus className="size-[18px]" aria-hidden />
          )}
          {hasOptions ? (quantity > 0 ? `เลือกเพิ่ม • ในตะกร้า ${quantity}` : "เลือกตัวเลือก") : "เพิ่มลงตะกร้า"}
        </span>
      )}
    </li>
  );
}
