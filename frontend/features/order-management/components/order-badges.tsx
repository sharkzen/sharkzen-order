import { Badge } from "@/components/ui";
import {
  FOOD_STATUS_BADGE,
  PAYMENT_BADGE,
  PAYMENT_METHOD_LABEL,
} from "@/features/order-management/lib/labels";
import type { FoodStatus, PaymentMethod, PaymentStatus } from "@/features/order-management/types";

export function FoodStatusBadge({ status }: { status: FoodStatus }) {
  const { label, tone, icon: Icon } = FOOD_STATUS_BADGE[status];
  return (
    <Badge tone={tone}>
      <Icon className="size-[13px]" aria-hidden />
      {label}
    </Badge>
  );
}

/** สถานะการชำระเงิน พร้อมช่องทางเป็นข้อความรองด้านล่าง */
export function PaymentBadge({
  status,
  method,
  cancelled = false,
}: {
  status: PaymentStatus;
  method: PaymentMethod;
  /** ออเดอร์ที่ยกเลิกไม่มียอดให้ชำระ จึงไม่แสดงว่ารอชำระ */
  cancelled?: boolean;
}) {
  if (cancelled && status !== "paid") {
    return (
      <div className="flex flex-col items-start gap-1">
        <span className="text-muted-foreground text-xs">ไม่มียอดชำระ</span>
      </div>
    );
  }
  const { label, tone, icon: Icon } = PAYMENT_BADGE[status];
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge tone={tone}>
        <Icon className="size-[13px]" aria-hidden />
        {label}
      </Badge>
      <span className="text-muted-foreground text-[10px]">
        {PAYMENT_METHOD_LABEL[method]}
      </span>
    </div>
  );
}
