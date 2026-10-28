import { cn } from "@/lib/cn";

const SPOKES = [
  [128, 32, 128, 64],
  [195.9, 60.1, 173.3, 82.7],
  [224, 128, 192, 128],
  [195.9, 195.9, 173.3, 173.3],
  [128, 224, 128, 192],
  [60.1, 195.9, 82.7, 173.3],
  [32, 128, 64, 128],
  [60.1, 60.1, 82.7, 82.7],
] as const;

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      viewBox="0 0 256 256"
      fill="none"
      stroke="currentColor"
      strokeWidth={24}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {SPOKES.map(([x1, y1, x2, y2]) => (
        <line key={`${x1}-${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} />
      ))}
    </svg>
  );
}

/** โหลดทั้งหน้า: วงหมุนกลางจอ บนฉากโปร่งแสงที่ยังเห็นเนื้อหาด้านหลัง */
export function PageLoader() {
  return (
    <div
      role="status"
      aria-label="กำลังโหลด"
      className="bg-primary-soft/60 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[2px]"
    >
      <Spinner className="text-primary size-8" />
    </div>
  );
}
