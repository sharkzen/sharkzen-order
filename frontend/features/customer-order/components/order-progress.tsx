"use client";

import { m, useReducedMotion } from "framer-motion";
import { PiBowlSteamFill, PiCheckBold, PiCookingPotFill, PiPaperPlaneRightFill } from "react-icons/pi";
import type { IconType } from "react-icons";
import { cn } from "@/lib/cn";
import type { CustomerOrderStatus } from "@/features/customer-order/lib/customer-api";

type NodeState = "done" | "active" | "next" | "todo";
type SegmentState = "full" | "running" | "empty";

const STEPS: { label: string; icon: IconType }[] = [
  { label: "ส่งออเดอร์แล้ว", icon: PiPaperPlaneRightFill },
  { label: "กำลังทำ", icon: PiCookingPotFill },
  { label: "เสิร์ฟแล้ว", icon: PiBowlSteamFill },
];

/** สถานะของแต่ละจุดและแต่ละเส้นเชื่อม ตามสถานะออเดอร์ (ไม่รวมยกเลิก) */
const PLAN: Record<Exclude<CustomerOrderStatus, "CANCELLED">, { nodes: NodeState[]; segments: SegmentState[]; note: string }> = {
  NEW: {
    nodes: ["done", "next", "todo"],
    segments: ["running", "empty"],
    note: "ส่งถึงครัวแล้ว รอครัวเริ่มทำ",
  },
  PREPARING: {
    nodes: ["done", "active", "todo"],
    segments: ["full", "running"],
    note: "ครัวกำลังทำอาหารของคุณ",
  },
  READY: {
    nodes: ["done", "done", "active"],
    segments: ["full", "full"],
    note: "อาหารพร้อมแล้ว พนักงานกำลังนำมาเสิร์ฟ",
  },
  SERVED: {
    nodes: ["done", "done", "done"],
    segments: ["full", "full"],
    note: "เสิร์ฟครบแล้ว ขอให้อร่อยกับมื้อนี้",
  },
};

const EASE = [0.22, 1, 0.36, 1] as const;

/** เส้นเชื่อมระหว่างสองจุด: เต็ม = เติมสีเข้ามา, running = มีแสงวิ่งไปหาจุดถัดไป */
function Segment({ state, delay }: { state: SegmentState; delay: number }) {
  const still = useReducedMotion();
  return (
    <span aria-hidden className="bg-border absolute top-[17px] left-1/2 z-0 h-1 w-full overflow-hidden rounded-full">
      {state === "full" && (
        <m.span
          className="bg-primary absolute inset-0 origin-left rounded-full"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay, ease: EASE }}
        />
      )}
      {state === "running" && (
        <>
          <span className="bg-primary/25 absolute inset-0 rounded-full" />
          {!still && (
            <m.span
              className="from-primary/0 via-primary to-primary/0 absolute inset-y-0 w-2/5 rounded-full bg-gradient-to-r"
              initial={{ left: "-40%" }}
              animate={{ left: "100%" }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.2 }}
            />
          )}
        </>
      )}
    </span>
  );
}

function Node({ state, icon: Icon, delay }: { state: NodeState; icon: IconType; delay: number }) {
  const still = useReducedMotion();
  const filled = state === "done" || state === "active";
  return (
    <span className="relative z-10 flex size-9 items-center justify-center">
      {(state === "active" || state === "next") && !still && (
        <m.span
          aria-hidden
          className="bg-primary/30 absolute inset-0 rounded-full"
          animate={{ scale: [1, 1.6], opacity: [0.7, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      <m.span
        className={cn(
          "relative flex size-9 items-center justify-center rounded-full border-2",
          filled
            ? "border-primary bg-primary text-primary-foreground"
            : state === "next"
              ? "border-primary bg-surface text-primary"
              : "border-border bg-surface text-muted-foreground",
        )}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 22, delay }}
      >
        {state === "done" ? <PiCheckBold className="size-[18px]" aria-hidden /> : <Icon className="size-[18px]" aria-hidden />}
      </m.span>
    </span>
  );
}

/** เส้นความคืบหน้าของออเดอร์: ส่งออเดอร์แล้ว → กำลังทำ → เสิร์ฟแล้ว */
export function OrderProgress({ status }: { status: Exclude<CustomerOrderStatus, "CANCELLED"> }) {
  const plan = PLAN[status];
  return (
    <div className="flex flex-col gap-3">
      <ol className="flex" aria-label="ความคืบหน้าของออเดอร์">
        {STEPS.map(({ label, icon }, index) => {
          const state = plan.nodes[index] as NodeState;
          return (
            <li
              key={label}
              aria-current={state === "active" ? "step" : undefined}
              className="relative flex flex-1 flex-col items-center gap-2"
            >
              {index < STEPS.length - 1 && <Segment state={plan.segments[index] as SegmentState} delay={0.25 + index * 0.3} />}
              <Node state={state} icon={icon} delay={index * 0.12} />
              <span
                className={cn(
                  "text-center text-xs leading-tight",
                  state === "active" ? "text-primary-strong font-bold" : state === "done" ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="bg-primary-soft text-primary-strong rounded-xl px-3 py-2 text-center text-xs font-medium">{plan.note}</p>
    </div>
  );
}
