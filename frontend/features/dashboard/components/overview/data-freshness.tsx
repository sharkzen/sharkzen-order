interface DataFreshnessProps {
  updatedAt: string;
  reportDate: string;
}

export function DataFreshness({ updatedAt, reportDate }: DataFreshnessProps) {
  return (
    <footer className="text-muted-foreground flex flex-col justify-between gap-1 text-[11px] sm:flex-row sm:gap-4">
      <p>
        อัปเดตล่าสุด {updatedAt} • ข้อมูลช่วง {reportDate}
      </p>
      <p>ยอดขายนับเฉพาะคำสั่งซื้อที่ชำระแล้ว ไม่รวมรายการยกเลิก</p>
    </footer>
  );
}
