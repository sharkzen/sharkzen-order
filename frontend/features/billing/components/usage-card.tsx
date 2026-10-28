import Link from "next/link";
import { Armchair, Users, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/cn";
import type { BillingOverview } from "@/features/billing/lib/billing-api";

interface MeterProps {
  icon: LucideIcon;
  label: string;
  used: number;
  limit: number | null;
  href: string;
}

function Meter({ icon: Icon, label, used, limit, href }: MeterProps) {
  const percent = limit ? Math.min(100, (used / limit) * 100) : 0;
  const full = limit !== null && used >= limit;
  const near = limit !== null && !full && used / limit >= 0.8;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Link href={href} className="text-foreground flex items-center gap-2 text-sm font-medium hover:underline">
          <Icon className="text-muted-foreground size-4" aria-hidden />
          {label}
        </Link>
        <p className="text-sm tabular-nums">
          <span className={cn("font-semibold", full ? "text-danger-strong" : "text-foreground")}>{used}</span>
          <span className="text-muted-foreground"> / {limit ?? "ไม่จำกัด"}</span>
        </p>
      </div>
      {limit !== null ? (
        <div
          role="progressbar"
          aria-label={`${label} ใช้ไป ${used} จาก ${limit}`}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={used}
          className="bg-primary-soft h-2 overflow-hidden rounded-full"
        >
          <div
            className={cn("h-full rounded-full", full ? "bg-danger" : near ? "bg-warning" : "bg-primary")}
            style={{ width: `${percent}%` }}
          />
        </div>
      ) : (
        <p className="text-muted-foreground text-[11px]">แพ็กเกจนี้ไม่จำกัดจำนวน</p>
      )}
      {full && <p className="text-danger-strong text-[11px]">ถึงเพดานของแพ็กเกจแล้ว อัปเกรดเพื่อเพิ่ม</p>}
    </div>
  );
}

/** การใช้งานเทียบกับเพดานของแพ็กเกจ (โต๊ะ และบัญชีพนักงาน) */
export function UsageCard({ overview }: { overview: BillingOverview }) {
  return (
    <Card className="flex flex-col gap-5 p-[22px]">
      <div className="flex flex-col gap-1">
        <h2 className="text-foreground text-base font-semibold">การใช้งานของร้าน</h2>
        <p className="text-muted-foreground text-xs">เทียบกับสิทธิ์ของแพ็กเกจปัจจุบัน</p>
      </div>
      <Meter icon={Armchair} label="โต๊ะ" used={overview.usage.tables} limit={overview.limits.tables} href={ROUTES.tables} />
      <Meter icon={Users} label="บัญชีพนักงาน" used={overview.usage.staff} limit={overview.limits.staff} href={ROUTES.staff} />
    </Card>
  );
}
