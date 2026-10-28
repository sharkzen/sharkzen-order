import { PiShoppingCartSimpleFill } from "react-icons/pi";
import { cn } from "@/lib/cn";
import type { CustomerMenuItem } from "@/features/customer-order/lib/customer-api";
import { price } from "@/features/customer-order/lib/format";
import { QuantityStepper } from "./quantity-stepper";

interface MenuCardProps {
  item: CustomerMenuItem;
  /** ชื่อหมวดของเมนู แสดงใต้ชื่อ */
  categoryName?: string;
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
 * การ์ดเมนู: แตะตรงไหนก็ได้ (รูป ชื่อ ปุ่ม) = เพิ่มลงตะกร้า หรือเปิดหน้าเลือกตัวเลือกถ้าเมนูมีตัวเลือก
 * ปุ่มโปร่งใสคลุมทั้งการ์ดไว้ด้านหลัง ส่วนตัวปรับจำนวนลอยอยู่ด้านหน้าจึงกดแยกได้
 */
export function MenuCard({ item, categoryName, quantity, canOrder, onChange, onChoose, onBlocked }: MenuCardProps) {
  const soldOut = !item.available;
  const hasOptions = item.optionGroups.length > 0;

  function activate() {
    if (!canOrder) return onBlocked();
    if (hasOptions) return onChoose();
    onChange(quantity + 1);
  }

  return (
    <li className="group relative isolate flex flex-col gap-2.5">
      {!soldOut && (
        <button
          type="button"
          onClick={activate}
          aria-label={hasOptions ? `เลือกตัวเลือก ${item.name}` : `เพิ่ม ${item.name} ลงตะกร้า`}
          className="focus-visible:ring-primary/50 absolute inset-0 z-0 cursor-pointer rounded-md focus-visible:ring-2 focus-visible:outline-none"
        />
      )}

      <div className="pointer-events-none flex flex-col gap-2.5">
        <div
          className={cn(
            "bg-muted text-muted-foreground relative flex aspect-square items-center justify-center overflow-hidden rounded-md",
            soldOut && "opacity-50 grayscale",
          )}
        >
          {item.featured && !soldOut && (
            <span className="bg-primary text-primary-foreground absolute top-0 left-0 z-10 rounded-br-md px-2.5 py-1 text-xs font-semibold">
              แนะนำ
            </span>
          )}
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image} alt="" loading="lazy" className="size-full object-contain" />
          ) : (
            <span className="text-xs font-medium">ยังไม่มีรูป</span>
          )}
        </div>

        <div className={cn("flex flex-col gap-0.5", soldOut && "opacity-60")}>
          <h3 className="text-foreground text-[15px] leading-snug font-semibold">{item.name}</h3>
          {categoryName && <p className="text-muted-foreground text-xs">{categoryName}</p>}
        </div>
      </div>

      <div className="pointer-events-none relative z-10 mt-auto flex flex-col gap-2">
        <p className={cn("text-primary-strong text-lg leading-none font-bold tabular-nums", soldOut && "opacity-60")}>
          {price(item.price)}
          {hasOptions && <span className="text-muted-foreground ml-1 text-xs font-medium">เริ่มต้น</span>}
        </p>
        {soldOut ? (
          <span className="text-muted-foreground bg-muted flex h-10 items-center justify-center rounded-md text-sm font-medium">
            หมดชั่วคราว
          </span>
        ) : quantity > 0 && !hasOptions ? (
          <QuantityStepper
            quantity={quantity}
            name={item.name}
            onChange={onChange}
            className="pointer-events-auto h-10 w-full rounded-md"
          />
        ) : (
          <span className="border-primary text-primary-strong group-hover:bg-primary-soft flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors">
            <PiShoppingCartSimpleFill className="size-4" aria-hidden />
            เพิ่มใส่ตะกร้า
            {quantity > 0 && <span className="bg-primary text-primary-foreground rounded-sm px-1.5 text-xs">{quantity}</span>}
          </span>
        )}
      </div>
    </li>
  );
}
