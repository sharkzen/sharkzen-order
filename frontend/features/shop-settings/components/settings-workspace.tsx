"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { notify } from "@/lib/toast";
import { hasErrors, validateSettings } from "@/features/shop-settings/lib/validate";
import type { SettingsErrors, ShopSettings } from "@/features/shop-settings/types";
import type { PendingImage } from "@/features/menu-management/components/image-picker";
import { HoursSection } from "./hours-section";
import { NotificationSection } from "./notification-section";
import { OrderingSection } from "./ordering-section";
import { SettingsNav } from "./settings-nav";
import { StaffCallSection } from "./staff-call-section";
import { ShopInfoSection } from "./shop-info-section";

interface SettingsWorkspaceProps {
  /** ค่าล่าสุดของร้านจากเซิร์ฟเวอร์ (เปลี่ยนเมื่อมีใครบันทึกหรือสลับเปิด-ปิดร้าน) */
  settings: ShopSettings;
  /** เวลาบันทึกล่าสุดที่แสดงท้ายหน้า */
  updatedAt: string;
  /** บันทึกค่าทั้งหมด โยน error เมื่อไม่สำเร็จ */
  onSave: (values: ShopSettings, cover: Blob | null) => Promise<void>;
  /** แก้ไขได้ (สิทธิ์ settings.edit ของผู้ใช้ปัจจุบัน) ถ้าไม่มีสิทธิ์จะดูได้อย่างเดียว */
  canEdit?: boolean;
}

const NO_ERRORS: SettingsErrors = { hours: {} };

/**
 * พื้นที่ทำงานของหน้าตั้งค่าร้าน (client เพราะเป็นฟอร์ม)
 * แก้ได้หลายหมวดพร้อมกัน แล้วบันทึกครั้งเดียวจากแถบด้านล่างที่ปรากฏเมื่อมีการแก้ไข
 * ข้อผิดพลาดแสดงหลังกดบันทึกครั้งแรก จากนั้นอัปเดตตามที่พิมพ์
 */
export function SettingsWorkspace({
  settings,
  updatedAt,
  onSave,
  canEdit = true,
}: SettingsWorkspaceProps) {
  const [saved, setSaved] = useState(settings);
  const [values, setValues] = useState(settings);
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  /** รูปปกที่ตัดแล้วแต่ยังไม่อัปโหลด */
  const [cover, setCover] = useState<PendingImage | null>(null);

  // ค่าจากเซิร์ฟเวอร์เปลี่ยน (เช่น สลับเปิด-ปิดร้านที่แถบบน): ถ้าไม่มีการแก้ค้างอยู่ให้ฟอร์มตามทันที
  if (settings !== saved) {
    if (JSON.stringify(values) === JSON.stringify(saved)) setValues(settings);
    setSaved(settings);
  }

  const dirty = useMemo(
    () => cover !== null || JSON.stringify(values) !== JSON.stringify(saved),
    [cover, values, saved],
  );
  const errors = useMemo(
    () => (attempted ? validateSettings(values) : NO_ERRORS),
    [attempted, values],
  );

  function change(patch: Partial<ShopSettings>) {
    setValues((prev) => ({ ...prev, ...patch }));
  }

  async function save() {
    setAttempted(true);
    if (hasErrors(validateSettings(values))) {
      notify.warning(
        "ยังบันทึกไม่ได้",
        "แก้ช่องที่มีข้อความสีแดงก่อน แล้วลองอีกครั้ง",
      );
      return;
    }
    setSaving(true);
    try {
      await onSave(values, cover?.blob ?? null);
      setCover(null);
      setAttempted(false);
      notify.success(
        "บันทึกการตั้งค่าแล้ว",
        "ลูกค้าและพนักงานจะเห็นค่าใหม่ทันที",
      );
    } catch (e) {
      notify.error(e);
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setValues(saved);
    setCover(null);
    setAttempted(false);
  }

  return (
    <div className="flex w-full flex-col gap-5 sm:gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-foreground text-[28px] leading-tight font-semibold">
          ตั้งค่าร้าน
        </h1>
        <p className="text-muted-foreground text-[13px]">
          ข้อมูลร้าน เวลาเปิด-ปิด การชำระเงิน และการแจ้งเตือน
          {!canEdit && " • คุณดูได้อย่างเดียว ไม่มีสิทธิ์แก้ไข"}
        </p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[200px_minmax(0,1fr)]">
        <SettingsNav />
        <div className="flex min-w-0 flex-col gap-5">
          {/* fieldset disabled ปิดทุกช่องและสวิตช์ในครั้งเดียวเมื่อไม่มีสิทธิ์แก้ไข */}
          <fieldset disabled={!canEdit} className="flex min-w-0 flex-col gap-5">
            <legend className="sr-only">การตั้งค่าร้าน</legend>
            <ShopInfoSection values={values} errors={errors} onChange={change} cover={cover} onCoverChange={setCover} />
            <HoursSection values={values} errors={errors} onChange={change} />
            <OrderingSection values={values} errors={errors} onChange={change} />
            <NotificationSection values={values} onChange={change} />
          </fieldset>
          {/* เสียงเรียกพนักงานเป็นค่าของเครื่องนี้ ใครก็ตั้งได้ ไม่ต้องมีสิทธิ์แก้ไขร้าน */}
          <StaffCallSection />
        </div>
      </div>

      <p className="text-muted-foreground text-[11px]">
        บันทึกล่าสุด {updatedAt}
      </p>

      {canEdit && dirty && (
        <div
          role="status"
          className="border-border bg-surface shadow-float sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-5 py-3.5"
        >
          <p className="text-foreground text-[13px] font-medium">
            มีการแก้ไขที่ยังไม่บันทึก
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={discard}
              disabled={saving}
            >
              ยกเลิกการแก้ไข
            </Button>
            <Button size="sm" onClick={save} loading={saving}>
              บันทึกการตั้งค่า
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
