import { FormField, Input } from "@/components/ui";
import type { SettingsErrors, ShopSettings } from "../types";
import { SettingsSection, ToggleRow } from "./settings-section";

interface OrderingSectionProps {
  values: ShopSettings;
  errors: SettingsErrors;
  onChange: (patch: Partial<ShopSettings>) => void;
}

/** การรับออเดอร์ ช่องทางชำระเงิน และค่าบริการ */
export function OrderingSection({
  values,
  errors,
  onChange,
}: OrderingSectionProps) {
  return (
    <SettingsSection
      id="ordering"
      title="การสั่งอาหารและชำระเงิน"
      description="กำหนดว่าลูกค้าสั่งและจ่ายเงินได้อย่างไร"
    >
      <div className="flex flex-col gap-5">
        <ToggleRow
          id="accept-orders"
          label="เปิดรับออเดอร์จากลูกค้า"
          description="ปิดชั่วคราวเมื่อครัวเต็ม ลูกค้าจะยังเปิดเมนูดูได้แต่กดสั่งไม่ได้"
          checked={values.acceptOrders}
          onChange={(acceptOrders) => onChange({ acceptOrders })}
        />
        <ToggleRow
          id="pay-before"
          label="ให้ชำระเงินก่อนส่งเข้าครัว"
          description="ออเดอร์จะเข้าครัวหลังชำระเงินแล้วเท่านั้น ลดความเสี่ยงลูกค้าไม่จ่าย"
          checked={values.payBeforeKitchen}
          onChange={(payBeforeKitchen) => onChange({ payBeforeKitchen })}
        />
      </div>

      <hr className="border-border" />

      <fieldset className="flex flex-col gap-5">
        <legend className="text-foreground mb-4 text-sm font-semibold">
          ช่องทางชำระเงินที่รับ
        </legend>
        <ToggleRow
          id="accept-transfer"
          label="โอนเงินผ่านพร้อมเพย์"
          description="ลูกค้าสแกนคิวอาร์โค้ดจ่ายจากหน้าสั่งอาหาร"
          checked={values.acceptTransfer}
          onChange={(acceptTransfer) => onChange({ acceptTransfer })}
        />
        {values.acceptTransfer && (
          <FormField
            label="เลขพร้อมเพย์"
            htmlFor="promptpay-id"
            required
            hint="เบอร์โทร 10 หลัก หรือเลขประจำตัว 13 หลัก"
            error={errors.promptPayId}
            className="sm:max-w-sm"
          >
            <Input
              id="promptpay-id"
              inputMode="numeric"
              value={values.promptPayId}
              invalid={!!errors.promptPayId}
              onChange={(e) => onChange({ promptPayId: e.target.value })}
              autoComplete="off"
            />
          </FormField>
        )}
        <ToggleRow
          id="accept-cash"
          label="เงินสด"
          description="พนักงานรับเงินที่โต๊ะแล้วกดยืนยันในระบบ"
          checked={values.acceptCash}
          onChange={(acceptCash) => onChange({ acceptCash })}
        />
        <ToggleRow
          id="accept-counter"
          label="ชำระที่เคาน์เตอร์"
          description="ลูกค้าเลือกจ่ายที่เคาน์เตอร์ตอนกลับ ออเดอร์จะแสดงสถานะรอชำระ"
          checked={values.acceptCounter}
          onChange={(acceptCounter) => onChange({ acceptCounter })}
        />
        {errors.payment && (
          <p role="alert" className="text-danger text-xs">
            {errors.payment}
          </p>
        )}
      </fieldset>

      <hr className="border-border" />

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="ค่าบริการ (%)"
          htmlFor="service-charge"
          hint="ใส่ 0 หากไม่เก็บค่าบริการ"
          error={errors.serviceCharge}
        >
          <Input
            id="service-charge"
            type="number"
            inputMode="decimal"
            min={0}
            max={20}
            step={0.5}
            value={
              Number.isFinite(values.serviceChargePercent)
                ? values.serviceChargePercent
                : ""
            }
            invalid={!!errors.serviceCharge}
            onChange={(e) =>
              onChange({
                serviceChargePercent:
                  e.target.value === "" ? NaN : Number(e.target.value),
              })
            }
          />
        </FormField>
        <ToggleRow
          id="vat-included"
          label="ราคาเมนูรวมภาษีมูลค่าเพิ่มแล้ว"
          description="ปิดเมื่อต้องการให้บวกภาษีเพิ่มตอนคิดเงิน"
          checked={values.vatIncluded}
          onChange={(vatIncluded) => onChange({ vatIncluded })}
          className="sm:pt-7"
        />
      </div>
    </SettingsSection>
  );
}
