"use client";

import { useState } from "react";
import { Button, Card, Skeleton } from "@/components/ui";
import { reportsApi } from "@/features/reports/lib/reports-api";
import type { DailySales, RangeDays } from "@/features/reports/types";
import { useResource } from "@/hooks/use-resource";
import { SocketEvent } from "@/lib/socket";
import { ReportsView } from "./reports-view";

const PLACEHOLDER_HOURS = 12;

const PLACEHOLDER: DailySales[] = Array.from({ length: 14 }, (_, index) => ({
  date: `2000-01-${String(index + 1).padStart(2, "0")}`,
  hours: Array.from({ length: PLACEHOLDER_HOURS }, (_, hour) => ({
    revenue: 400 + ((hour * 53 + index * 17) % 9) * 120,
    orders: 3,
  })),
  menu: Array.from({ length: 6 }, (_, menu) => ({ name: `เมนูตัวอย่าง ${menu + 1}`, quantity: 6 - menu, revenue: (6 - menu) * 100 })),
  methods: { cash: 1000, transfer: 2000, counter: 500 },
}));

const TIME_FORMAT: Intl.DateTimeFormatOptions = { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit" };

/** หน้ารายงานยอดขาย: ข้อมูลจริงของร้าน อัปเดตสดเมื่อมีการชำระเงินหรือออเดอร์เปลี่ยน */
export function ReportsWorkspace() {
  const [range, setRange] = useState<RangeDays>(7);
  const { data, error, reload } = useResource((signal) => reportsApi.sales(range, signal), {
    key: String(range),
    refetchOn: [SocketEvent.OrderCreated, SocketEvent.OrderUpdated],
    debounceMs: 600,
  });

  if (!data) {
    if (error) {
      return (
        <Card role="alert" className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-danger text-sm">โหลดรายงานไม่สำเร็จ: {error}</p>
          <Button variant="outline" onClick={reload}>
            ลองใหม่
          </Button>
        </Card>
      );
    }
    return (
      <Skeleton>
        <ReportsView
          days={PLACEHOLDER}
          range={7}
          onRangeChange={() => undefined}
          firstHour={10}
          hourCount={PLACEHOLDER_HOURS}
          updatedAt="00:00 น."
        />
      </Skeleton>
    );
  }

  return (
    <ReportsView
      days={data.days}
      range={range}
      onRangeChange={setRange}
      firstHour={data.firstHour}
      hourCount={data.hourCount}
      updatedAt={`${new Date(data.generatedAt).toLocaleTimeString("th-TH", TIME_FORMAT)} น.`}
    />
  );
}
