"use client";

import { AnimatePresence, m } from "framer-motion";
import { CircleCheck, ReceiptText } from "lucide-react";
import { FaMobileScreenButton } from "react-icons/fa6";
import { Badge } from "@/components/ui";
import { DEMO_ORDER_TOTAL, DEMO_TABLE } from "@/features/landing/data";
import { DemoPanel } from "./demo-panel";

const BILL_READY_STAGE = 3;
const PAID_STAGE = 4;

/** บิลของโต๊ะ: ขึ้นเมื่ออาหารพร้อมเสิร์ฟ และเปลี่ยนเป็น "ชำระแล้ว" เมื่อรับเงิน */
export function BillPanel({ stage }: { stage: number }) {
  const hasBill = stage >= BILL_READY_STAGE;
  const paid = stage >= PAID_STAGE;

  return (
    <DemoPanel title="บิลและการชำระเงิน" icon={ReceiptText}>
      <AnimatePresence mode="wait" initial={false}>
        {!hasBill ? (
          <m.p
            key="empty"
            className="text-muted-foreground py-6 text-center text-[13px]"
            exit={{ opacity: 0 }}
          >
            ยังไม่มีบิลค้างชำระ
          </m.p>
        ) : (
          <m.div
            key="bill"
            className="bg-background flex flex-col gap-2 rounded-lg p-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <span className="text-foreground text-[13px] font-semibold">
                {DEMO_TABLE}
              </span>
              <Badge
                tone={paid ? "success" : "warning"}
                className="px-2 py-0.5 text-[11px]"
              >
                {paid ? (
                  <>
                    <CircleCheck className="size-3" aria-hidden />
                    ชำระแล้ว
                  </>
                ) : (
                  "รอชำระ"
                )}
              </Badge>
            </div>
            <p className="font-display text-foreground text-3xl font-semibold">
              ฿{DEMO_ORDER_TOTAL}
            </p>
            <p className="text-muted-foreground flex h-4 items-center gap-1.5 text-xs">
              {paid && (
                <>
                  <FaMobileScreenButton className="text-primary size-3" aria-hidden />
                  ชำระด้วยโอนจ่าย
                </>
              )}
            </p>
          </m.div>
        )}
      </AnimatePresence>
    </DemoPanel>
  );
}
