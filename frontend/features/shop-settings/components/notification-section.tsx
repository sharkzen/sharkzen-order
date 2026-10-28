import type { ShopSettings } from "@/features/shop-settings/types";
import { SettingsSection, ToggleRow } from "./settings-section";

interface NotificationSectionProps {
  values: ShopSettings;
  onChange: (patch: Partial<ShopSettings>) => void;
}

/** การแจ้งเตือนฝั่งร้านเมื่อมีออเดอร์เข้า */
export function NotificationSection({
  values,
  onChange,
}: NotificationSectionProps) {
  return (
    <SettingsSection
      id="notifications"
      title="การแจ้งเตือน"
      description="เลือกวิธีรู้ตัวเมื่อมีออเดอร์ใหม่ โดยไม่ต้องจ้องหน้าจอ"
    >
      <div className="flex flex-col gap-5">
        <ToggleRow
          id="new-order-sound"
          label="เสียงเมื่อมีออเดอร์ใหม่"
          description="เล่นเสียงทุกครั้งที่ออเดอร์เข้า ตั้งระดับเสียงได้ที่หน้าจอครัว"
          checked={values.newOrderSound}
          onChange={(newOrderSound) => onChange({ newOrderSound })}
        />
        <ToggleRow
          id="new-order-popup"
          label="แสดงป้ายแจ้งบนหน้าจอ"
          description="ขึ้นข้อความมุมจอเมื่อมีออเดอร์ใหม่ แม้อยู่หน้าอื่น"
          checked={values.newOrderPopup}
          onChange={(newOrderPopup) => onChange({ newOrderPopup })}
        />
        <ToggleRow
          id="daily-summary"
          label="ส่งสรุปยอดขายทางอีเมลทุกวัน"
          description="ส่งหลังร้านปิด พร้อมยอดขายและเมนูขายดีของวันนั้น"
          checked={values.dailySummary}
          onChange={(dailySummary) => onChange({ dailySummary })}
        />
      </div>
    </SettingsSection>
  );
}
