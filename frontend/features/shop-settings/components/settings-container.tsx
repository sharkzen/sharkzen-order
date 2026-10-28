"use client";

import { useMemo } from "react";
import { Skeleton } from "@/components/ui";
import { useShop } from "@/features/shop/components/shop-provider";
import { shopApi, uploadCoverImage, type Shop } from "@/features/shop/lib/shop-api";
import type { ShopSettings } from "@/features/shop-settings/types";
import { SettingsWorkspace } from "./settings-workspace";

const DAY = { open: true, from: "10:00", to: "22:00" };

const PLACEHOLDER: ShopSettings = {
  name: "ชื่อร้านตัวอย่าง",
  branch: "สาขาตัวอย่าง",
  phone: "000-000-0000",
  address: "ที่อยู่ร้านตัวอย่าง",
  coverImage: "",
  hours: Array.from({ length: 7 }, () => DAY),
  acceptOrders: true,
  payBeforeKitchen: false,
  acceptTransfer: true,
  acceptCash: true,
  acceptCounter: true,
  promptPayId: "0000000000",
  promptPayTitle: "นาย",
  promptPayFirstName: "ชื่อ",
  promptPayLastName: "นามสกุล",
  serviceChargePercent: 0,
  vatIncluded: true,
  newOrderSound: true,
  newOrderPopup: true,
  dailySummary: false,
};

/** ค่าที่ฟอร์มใช้ (acceptOrders คือสถานะเปิดรับออเดอร์ของร้าน) */
const toSettings = (shop: Shop): ShopSettings => ({
  name: shop.name,
  branch: shop.branch,
  phone: shop.phone,
  address: shop.address,
  coverImage: shop.coverImage,
  hours: shop.hours,
  acceptOrders: shop.isOpen,
  payBeforeKitchen: shop.payBeforeKitchen,
  acceptTransfer: shop.acceptTransfer,
  acceptCash: shop.acceptCash,
  acceptCounter: shop.acceptCounter,
  promptPayId: shop.promptPayId,
  promptPayTitle: shop.promptPayTitle,
  promptPayFirstName: shop.promptPayFirstName,
  promptPayLastName: shop.promptPayLastName,
  serviceChargePercent: shop.serviceChargePercent,
  vatIncluded: shop.vatIncluded,
  newOrderSound: shop.newOrderSound,
  newOrderPopup: shop.newOrderPopup,
  dailySummary: shop.dailySummary,
});

const UPDATED_FORMAT: Intl.DateTimeFormatOptions = {
  timeZone: "Asia/Bangkok",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
};

/** หน้าตั้งค่าร้าน: ใช้ข้อมูลร้านชุดเดียวกับแถบบน บันทึกแล้วทุกแท็บเห็นค่าใหม่ทันที */
export function SettingsContainer() {
  const { shop, setShop } = useShop();
  const settings = useMemo(() => (shop ? toSettings(shop) : undefined), [shop]);

  if (!shop || !settings) {
    return (
      <Skeleton>
        <SettingsWorkspace settings={PLACEHOLDER} updatedAt="00:00 น." onSave={async () => undefined} />
      </Skeleton>
    );
  }

  async function save(values: ShopSettings, cover: Blob | null) {
    if (!shop) return;
    const { acceptOrders, ...rest } = values;
    // อัปโหลดรูปปกใหม่ตอนกดบันทึก จึงไม่มีรูปค้างบน R2 ถ้ายกเลิกการแก้ไข
    const coverImage = cover ? await uploadCoverImage(cover) : rest.coverImage;
    const { data } = await shopApi.update({
      ...rest,
      coverImage,
      name: rest.name.trim(),
      branch: rest.branch.trim(),
      phone: rest.phone.trim(),
      address: rest.address.trim(),
      promptPayId: rest.promptPayId.replace(/\D/g, ""),
      promptPayFirstName: rest.promptPayFirstName.trim(),
      promptPayLastName: rest.promptPayLastName.trim(),
    });
    setShop(data);
    // สวิตช์ "รับออเดอร์" ใช้ endpoint เปิด-ปิดร้านเดียวกับแถบบน
    if (acceptOrders !== data.isOpen) setShop((await shopApi.setOpen(acceptOrders)).data);
  }

  return (
    <SettingsWorkspace
      settings={settings}
      updatedAt={`${new Date(shop.updatedAt).toLocaleString("th-TH", UPDATED_FORMAT)} น.`}
      onSave={save}
    />
  );
}
