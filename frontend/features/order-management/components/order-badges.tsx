import { Badge } from "@/components/ui";
import {
  FOOD_STATUS_BADGE,
  PAYMENT_BADGE,
  PAYMENT_METHOD_LABEL,
} from "../lib/labels";
import type { FoodStatus, PaymentMethod, PaymentStatus } from "../types";

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
}: {
  status: PaymentStatus;
  method: PaymentMethod;
}) {
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
