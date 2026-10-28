import { FormField, Input, Textarea } from "@/components/ui";
import type { SettingsErrors, ShopSettings } from "@/features/shop-settings/types";
import type { PendingImage } from "@/features/menu-management/components/image-picker";
import { CoverImageField } from "./cover-image-field";
import { SettingsSection } from "./settings-section";

interface SectionProps {
  values: ShopSettings;
  errors: SettingsErrors;
  onChange: (patch: Partial<ShopSettings>) => void;
  cover: PendingImage | null;
  onCoverChange: (cover: PendingImage | null) => void;
}

/** ชื่อร้านและช่องทางติดต่อ ที่แสดงให้ลูกค้าเห็นบนหน้าสั่งอาหาร */
export function ShopInfoSection({ values, errors, onChange, cover, onCoverChange }: SectionProps) {
  return (
    <SettingsSection
      id="shop"
      title="ข้อมูลร้าน"
      description="ลูกค้าเห็นข้อมูลนี้บนหน้าสั่งอาหารและใบเสร็จ"
    >
      <CoverImageField
        current={values.coverImage}
        pending={cover}
        onPendingChange={onCoverChange}
        onRemove={() => {
          onCoverChange(null);
          onChange({ coverImage: "" });
        }}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="ชื่อร้าน"
          htmlFor="shop-name"
          required
          error={errors.name}
        >
          <Input
            id="shop-name"
            value={values.name}
            invalid={!!errors.name}
            onChange={(e) => onChange({ name: e.target.value })}
            autoComplete="organization"
          />
        </FormField>
        <FormField
          label="ชื่อสาขา"
          htmlFor="shop-branch"
          hint="ไม่บังคับ ถ้ามีสาขาเดียวเว้นว่างได้"
        >
          <Input
            id="shop-branch"
            value={values.branch}
            onChange={(e) => onChange({ branch: e.target.value })}
          />
        </FormField>
        <FormField
          label="เบอร์โทรร้าน"
          htmlFor="shop-phone"
          required
          error={errors.phone}
        >
          <Input
            id="shop-phone"
            type="tel"
            inputMode="tel"
            value={values.phone}
            invalid={!!errors.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            autoComplete="tel"
          />
        </FormField>
        <FormField
          label="ที่อยู่ร้าน"
          htmlFor="shop-address"
          className="sm:col-span-2"
        >
          <Textarea
            id="shop-address"
            rows={3}
            value={values.address}
            onChange={(e) => onChange({ address: e.target.value })}
          />
        </FormField>
      </div>
    </SettingsSection>
  );
}
