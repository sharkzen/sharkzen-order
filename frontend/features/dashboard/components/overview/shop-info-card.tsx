"use client";

import Link from "next/link";
import { CircleCheck, CirclePause } from "lucide-react";
import { Badge } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { useShop } from "@/features/shop/components/shop-provider";
import type { DayHours } from "@/features/shop-settings/types";

/** สรุปเวลาเปิดทำการ เช่น "เปิดทุกวัน 10:00–22:00 น." หรือ "จ.–ศ. 10:00–22:00 น." */
function describeHours(hours: DayHours[]) {
  const open = hours.filter((day) => day.open);
  if (open.length === 0) return "ปิดทุกวัน";
  const [first] = open;
  const same = open.every((day) => day.from === first.from && day.to === first.to);
  const range = same ? `${first.from}–${first.to} น.` : "เวลาเปิดต่างกันตามวัน";
  return `${open.length === 7 ? "เปิดทุกวัน" : `เปิด ${open.length} วัน/สัปดาห์`} ${range}`;
}

export function ShopInfoCard() {
  const { shop } = useShop();
  const isOpen = shop?.isOpen ?? true;

  return (
    <div className="bg-primary-soft flex flex-col items-start gap-2.5 rounded-xl p-5">
      <p className="text-foreground text-[15px] font-semibold">{shop?.name ?? " "}</p>
      <Badge tone={isOpen ? "success" : "danger"}>
        {isOpen ? (
          <CircleCheck className="size-[13px]" aria-hidden />
        ) : (
          <CirclePause className="size-[13px]" aria-hidden />
        )}
        {isOpen ? "เปิดรับออเดอร์" : "ปิดรับออเดอร์"}
      </Badge>
      <p className="text-muted-foreground text-xs">
        {[shop?.branch, shop ? describeHours(shop.hours) : "", shop?.phone ? `โทร. ${shop.phone}` : ""]
          .filter(Boolean)
          .join(" ") || " "}
      </p>
      <Link href={ROUTES.settings} className="text-primary-strong text-xs font-medium hover:underline">
        แก้ไขข้อมูลร้าน →
      </Link>
    </div>
  );
}
