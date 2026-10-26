interface DataFreshnessProps {
  updatedAt: string;
  reportDate: string;
}

export function DataFreshness({ updatedAt, reportDate }: DataFreshnessProps) {
  return (
    <footer className="text-muted-foreground flex flex-col justify-between gap-1 text-[11px] sm:flex-row sm:gap-4">
      <p>
        อัปเดตล่าสุด {updatedAt} • ข้อมูลประจำวันที่ {reportDate}
      </p>
      <p>ยอดขายรวมคำสั่งซื้อที่ยืนยันแล้ว ไม่รวมรายการยกเลิก</p>
    </footer>
  );
}
