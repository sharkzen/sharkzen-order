"use client";

import { AnimatePresence, m } from "framer-motion";
import { ChefHat } from "lucide-react";
import { Badge } from "@/components/ui";
import { DEMO_ORDER_ITEMS, DEMO_TABLE } from "../../data";
import { DemoPanel } from "./demo-panel";

type TicketStatus = { label: string; tone: "info" | "warning" | "success" };

function ticketStatus(stage: number): TicketStatus {
  if (stage <= 1) return { label: "ออร์เดอร์ใหม่", tone: "info" };
  if (stage === 2) return { label: "กำลังทำ", tone: "warning" };
  return { label: "พร้อมเสิร์ฟ", tone: "success" };
}

/** หน้าจอครัว: ใบออร์เดอร์เข้ามาเมื่อลูกค้ากดสั่ง แล้วเปลี่ยนสถานะตามขั้น */
export function KitchenPanel({ stage }: { stage: number }) {
  const status = ticketStatus(stage);

  return (
    <DemoPanel title="หน้าจอครัว" icon={ChefHat}>
      <AnimatePresence mode="wait" initial={false}>
        {stage < 1 ? (
          <m.p
            key="empty"
            className="text-muted-foreground py-6 text-center text-[13px]"
            exit={{ opacity: 0 }}
          >
            รอออร์เดอร์ใหม่
          </m.p>
        ) : (
          <m.div
            key="ticket"
            className="bg-background flex flex-col gap-2 rounded-lg p-3"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-foreground text-[13px] font-semibold">
                {DEMO_TABLE} • {DEMO_ORDER_ITEMS.length} รายการ
              </span>
              <AnimatePresence mode="wait" initial={false}>
                <m.span
                  key={status.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.18 }}
                >
                  <Badge tone={status.tone} className="px-2 py-0.5 text-xs">
                    {status.label}
                  </Badge>
                </m.span>
              </AnimatePresence>
            </div>
            <ul className="text-muted-foreground flex flex-col gap-0.5 text-xs">
              {DEMO_ORDER_ITEMS.map((item) => (
                <li key={item.name}>1 × {item.name}</li>
              ))}
            </ul>
          </m.div>
        )}
      </AnimatePresence>
    </DemoPanel>
  );
}
