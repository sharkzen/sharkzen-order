import { ReceiptText, ShoppingBasket, Soup, Wallet } from "lucide-react";
import type { ComponentType } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { formatNumber } from "@/features/dashboard/lib/format";
import { changePercent } from "../lib/report-utils";
import type { PeriodSummary } from "../types";

interface SummaryCardsProps {
  current: PeriodSummary;
  previous: PeriodSummary;
  /** ข้อความเทียบช่วงก่อนหน้า เช่น "เทียบ 7 วันก่อนหน้า" */
  compareLabel: string;
}

interface CardSpec {
  label: string;
  value: string;
  unit: string;
  delta: number | null;
  icon: ComponentType<{ className?: string }>;
}

/** ตัวเลขสรุปของช่วงที่เลือก พร้อมการเปลี่ยนแปลงเทียบช่วงก่อนหน้าที่ยาวเท่ากัน */
export function SummaryCards({
  current,
  previous,
  compareLabel,
}: SummaryCardsProps) {
  const cards: CardSpec[] = [
    {
      label: "ยอดขายรวม",
      value: formatNumber(current.revenue),
      unit: "บาท",
      delta: changePercent(current.revenue, previous.revenue),
      icon: Wallet,
    },
    {
      label: "คำสั่งซื้อ",
      value: formatNumber(current.orders),
      unit: "รายการ",
      delta: changePercent(current.orders, previous.orders),
      icon: ReceiptText,
    },
    {
      label: "ยอดเฉลี่ยต่อคำสั่งซื้อ",
      value: formatNumber(current.average),
      unit: "บาท",
      delta: changePercent(current.average, previous.average),
      icon: ShoppingBasket,
    },
    {
      label: "อาหารที่ขายได้",
      value: formatNumber(current.dishes),
      unit: "จาน",
      delta: changePercent(current.dishes, previous.dishes),
      icon: Soup,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, unit, delta, icon: Icon }) => (
        <Card key={label} className="flex flex-col gap-2.5 p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-muted-foreground text-[13px]">{label}</p>
            <Icon className="text-primary size-[18px]" aria-hidden />
          </div>
          <p className="flex items-baseline gap-2">
            <span className="font-display text-foreground text-[30px] leading-[1.4] font-semibold">
              {value}
            </span>
            <span className="text-muted-foreground text-xs">{unit}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <DeltaBadge delta={delta} />
            <span className="text-muted-foreground text-[11px]">
              {compareLabel}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

/** ไอคอน + ข้อความ ไม่พึ่งสีอย่างเดียว */
function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <Badge className="text-xs">ไม่มีข้อมูลเทียบ</Badge>;
  }
  if (delta === 0) {
    return <Badge className="text-xs">เท่าเดิม</Badge>;
  }
  const up = delta > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <Badge tone={up ? "success" : "danger"} className="text-xs">
      <Icon className="size-3" aria-hidden />
      {up ? "เพิ่มขึ้น" : "ลดลง"} {Math.abs(delta)}%
    </Badge>
  );
}
