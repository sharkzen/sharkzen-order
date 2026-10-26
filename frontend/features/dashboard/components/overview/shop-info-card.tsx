import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import type { ShopInfo } from "../../types";

export function ShopInfoCard({ shop }: { shop: ShopInfo }) {
  return (
    <div className="bg-primary-soft flex flex-col items-start gap-2.5 rounded-xl p-5">
      <p className="text-foreground text-[15px] font-semibold">{shop.name}</p>
      <Badge tone={shop.isOpen ? "success" : "neutral"}>
        <CircleCheck className="size-[13px]" aria-hidden />
        {shop.isOpen ? "เปิดให้บริการ" : "ปิดให้บริการ"}
      </Badge>
      <p className="text-muted-foreground text-xs">
        {shop.branch} {shop.hours} โทร. {shop.phone}
      </p>
      <Link
        href={ROUTES.settings}
        className="text-primary-strong text-xs font-medium hover:underline"
      >
        แก้ไขข้อมูลร้าน →
      </Link>
    </div>
  );
}
