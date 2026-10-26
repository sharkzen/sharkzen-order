"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { DEMO_LAST_STAGE, DEMO_STAGES } from "../../data";
import { BillPanel } from "./bill-panel";
import { KitchenPanel } from "./kitchen-panel";
import { PhonePanel } from "./phone-panel";
import { StageList } from "./stage-list";

const STEP_MS = 2200;
const HOLD_LAST_MS = 3600;

/**
 * ตัวอย่างการทำงานของโต๊ะ 05 แบบวนซ้ำ: ลูกค้าสั่ง → ครัวรับ → เสิร์ฟ → ชำระเงิน
 * - หยุดอัตโนมัติเมื่อเมาส์อยู่บนตัวอย่าง หรือเมื่อกดเลือกขั้นเอง
 * - ถ้าผู้ใช้ตั้งค่าลดการเคลื่อนไหว จะแสดงขั้นสุดท้ายนิ่งๆ
 */
export function OrderFlowDemo() {
  const reducedMotion = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [paused, setPaused] = useState(false);

  const current = reducedMotion ? DEMO_LAST_STAGE : stage;

  useEffect(() => {
    if (reducedMotion || paused) return;
    const delay = stage === DEMO_LAST_STAGE ? HOLD_LAST_MS : STEP_MS;
    const timer = setTimeout(
      () => setStage((s) => (s + 1) % DEMO_STAGES.length),
      delay,
    );
    return () => clearTimeout(timer);
  }, [stage, paused, reducedMotion]);

  function selectStage(next: number) {
    setStage(next);
    setPaused(true);
  }

  return (
    <div
      role="group"
      aria-label="ตัวอย่างการทำงานของระบบ"
      className="flex flex-col gap-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="grid items-center gap-4 sm:grid-cols-[270px_1fr]">
        <PhonePanel sent={current >= 1} />
        <div className="flex flex-col gap-4">
          <KitchenPanel stage={current} />
          <BillPanel stage={current} />
        </div>
      </div>
      <StageList current={current} onSelect={selectStage} />
      <p className="sr-only" aria-live="polite">
        {DEMO_STAGES[current]}
      </p>
    </div>
  );
}
