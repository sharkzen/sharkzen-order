import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { getPageWindow } from "@/lib/pagination";

interface PaginationProps {
  page: number;
  pageCount: number;
  from: number;
  to: number;
  total: number;
  onChange: (page: number) => void;
}

const ARROW =
  "text-muted-foreground hover:bg-muted focus-visible:ring-primary/50 flex size-8 cursor-pointer items-center justify-center rounded-[7px] transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40";

/** แบ่งหน้าพร้อมข้อความ "แสดง x–y จาก n รายการ" ใช้ร่วมกันทุกตาราง */
export function Pagination({
  page,
  pageCount,
  from,
  to,
  total,
  onChange,
}: PaginationProps) {
  return (
    <div className="border-border flex flex-col items-center justify-between gap-3 border-t px-4 py-[18px] sm:flex-row sm:px-5">
      <p className="text-muted-foreground text-[13px]" aria-live="polite">
        แสดง {from}–{to} จาก {total} รายการ
      </p>
      {pageCount > 1 && (
        <nav aria-label="เลือกหน้า" className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="หน้าก่อนหน้า"
            disabled={page === 1}
            onClick={() => onChange(page - 1)}
            className={ARROW}
          >
            <ChevronLeft className="size-[17px]" aria-hidden />
          </button>
          {getPageWindow(page, pageCount).map((item, index) =>
            item === "gap" ? (
              <span
                key={`gap-${index}`}
                aria-hidden
                className="text-muted-foreground w-6 text-center text-[13px]"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-label={`หน้า ${item}`}
                aria-current={item === page ? "page" : undefined}
                onClick={() => onChange(item)}
                className={cn(
                  "focus-visible:ring-primary/50 size-8 cursor-pointer rounded-[7px] text-[13px] transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  item === page
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            aria-label="หน้าถัดไป"
            disabled={page === pageCount}
            onClick={() => onChange(page + 1)}
            className={ARROW}
          >
            <ChevronRight className="size-[17px]" aria-hidden />
          </button>
        </nav>
      )}
    </div>
  );
}
