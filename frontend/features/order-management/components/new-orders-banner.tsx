import { RingingBellIcon } from "@/components/icons/ringing-bell";

interface NewOrdersBannerProps {
  count: number;
  onView: () => void;
}

/** แจ้งเตือนคำสั่งซื้อใหม่ที่ยังไม่ได้ส่งเข้าครัว (ไม่แสดงเมื่อไม่มี) */
export function NewOrdersBanner({ count, onView }: NewOrdersBannerProps) {
  if (count === 0) return null;

  return (
    <div
      role="status"
      className="bg-primary-soft text-primary-strong flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-lg px-[18px] py-[13px]"
    >
      <RingingBellIcon className="size-5 shrink-0" />
      <p className="min-w-0 flex-1 text-sm font-medium">
        มีคำสั่งซื้อใหม่ {count} รายการ รอส่งเข้าครัว
      </p>
      <button
        type="button"
        onClick={onView}
        className="focus-visible:ring-primary/50 cursor-pointer rounded text-[13px] font-semibold whitespace-nowrap hover:underline focus-visible:ring-2 focus-visible:outline-none"
      >
        ดูรายการใหม่ →
      </button>
    </div>
  );
}
