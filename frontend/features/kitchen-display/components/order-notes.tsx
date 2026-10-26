import { Check, MessageSquare, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "note" | "alert" | "ready";

const TONES: Record<Tone, { className: string; icon: typeof Check }> = {
  note: {
    className: "bg-warning-soft text-warning-strong",
    icon: MessageSquare,
  },
  alert: {
    className: "bg-danger-soft text-danger-strong",
    icon: TriangleAlert,
  },
  ready: { className: "bg-success-soft text-success-strong", icon: Check },
};

/** แถบข้อความสั้นใต้รายการอาหาร: หมายเหตุจากลูกค้า (เหลือง), แจ้งเตือนเร่งด่วน (แดง), จุดรับอาหาร (เขียว) */
export function NoteStrip({
  tone,
  children,
}: {
  tone: Tone;
  children: string;
}) {
  const { className, icon: Icon } = TONES[tone];
  return (
    <div
      className={cn(
        "flex min-h-[42px] items-center gap-2 rounded-lg p-2.5 text-[13px]",
        className,
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1">{children}</p>
    </div>
  );
}
