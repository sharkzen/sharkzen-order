import { Ban, Search, TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui";

interface BoardSummaryProps {
  active: number;
  urgent: number;
  urgentAfter: number;
  /** งานที่หน้าร้านยกเลิกและครัวยังไม่ได้กดรับทราบ */
  cancelled: number;
  query: string;
  onQueryChange: (value: string) => void;
}

/** แถบสรุปงาน: ชื่อหน้า จำนวนงานค้าง งานเร่งด่วน งานที่หน้าร้านยกเลิก และช่องค้นหาโต๊ะ/ชื่ออาหาร */
export function BoardSummary({
  active,
  urgent,
  urgentAfter,
  cancelled,
  query,
  onQueryChange,
}: BoardSummaryProps) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-6 px-5 pt-4">
      <div className="flex items-center gap-4">
        <h1 className="font-display text-foreground text-xl font-semibold">
          หน้าจอครัว
        </h1>
        <p className="text-muted-foreground text-xs" aria-live="polite">
          งานค้าง <strong className="text-foreground">{active}</strong> รายการ
        </p>
        {cancelled > 0 && (
          <p
            role="status"
            className="text-danger-strong bg-danger-soft flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
          >
            <Ban className="size-3.5" aria-hidden />
            หน้าร้านยกเลิก {cancelled} งาน รอกดรับทราบ
          </p>
        )}
        {urgent > 0 ? (
          <p className="text-danger-strong bg-danger-soft flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold">
            <TriangleAlert className="size-3.5" aria-hidden />
            เกิน {urgentAfter} นาที {urgent} งาน ต้องเร่งทำ
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">
            ไม่มีงานเกิน {urgentAfter} นาที
          </p>
        )}
      </div>

      <div className="relative w-72">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="ค้นหาเลขโต๊ะ หรือชื่ออาหาร"
          aria-label="ค้นหางานในกระดานครัว"
          className="h-9 rounded-lg pl-9 text-sm"
        />
      </div>
    </div>
  );
}
