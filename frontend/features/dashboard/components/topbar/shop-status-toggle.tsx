"use client";

import { useState } from "react";
import { CircleCheck, CirclePause } from "lucide-react";
import { Badge, ConfirmDialog, Switch } from "@/components/ui";
import { useShop } from "@/features/shop/components/shop-provider";

/** สวิตช์เปิด-ปิดรับออเดอร์ของร้าน ปิดแล้วลูกค้าสั่งผ่าน QR ไม่ได้ทันที */
export function ShopStatusToggle() {
  const { shop, toggling, setOpen } = useShop();
  const [confirmClose, setConfirmClose] = useState(false);
  const isOpen = shop?.isOpen ?? true;

  return (
    <>
      <div className="flex items-center gap-2.5">
        <Badge tone={isOpen ? "success" : "danger"} className="hidden sm:inline-flex">
          {isOpen ? (
            <CircleCheck className="size-[13px]" aria-hidden />
          ) : (
            <CirclePause className="size-[13px]" aria-hidden />
          )}
          {isOpen ? "เปิดรับออเดอร์" : "ปิดรับออเดอร์"}
        </Badge>
        <Switch
          aria-label={isOpen ? "ปิดรับออเดอร์" : "เปิดรับออเดอร์"}
          checked={isOpen}
          disabled={!shop || toggling}
          onCheckedChange={(next) => (next ? setOpen(true) : setConfirmClose(true))}
        />
      </div>

      <ConfirmDialog
        open={confirmClose}
        title="ปิดรับออเดอร์ชั่วคราว?"
        description="ลูกค้าที่สแกน QR จะสั่งอาหารไม่ได้จนกว่าจะเปิดร้านอีกครั้ง ออเดอร์ที่สั่งไปแล้วยังทำต่อตามปกติ"
        confirmLabel="ปิดรับออเดอร์"
        tone="danger"
        onCancel={() => setConfirmClose(false)}
        onConfirm={() => {
          setConfirmClose(false);
          void setOpen(false);
        }}
      />
    </>
  );
}
