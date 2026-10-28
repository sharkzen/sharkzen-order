"use client";

import { useMemo, useState } from "react";
import { ReceiptText } from "lucide-react";
import { Button, Dialog } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useSocketConnected } from "@/lib/socket";
import { notify } from "@/lib/toast";
import type { PayInput } from "@/features/cashier/lib/cashier-api";
import { billTotal, isDue } from "@/features/cashier/lib/bill-utils";
import { useIsDesktop } from "@/features/cashier/lib/use-desktop";
import type {
  BillTotals,
  CheckoutConfig,
  CheckoutMethod,
  FinishAction,
  Payment,
  TableBill,
} from "@/features/cashier/types";
import { BillPanel } from "./bill-panel";
import { CashierStats } from "./cashier-stats";
import { CheckoutModal, type CheckoutState } from "./checkout-modal";
import { ReceiptSheet } from "./receipt-sheet";
import { TableList, type TableView } from "./table-list";

export interface CashierActions {
  /** บันทึกการชำระ คืนยอดที่ server บันทึกจริง หรือ undefined เมื่อไม่สำเร็จ (แจ้งสาเหตุให้แล้ว) */
  pay: (tableId: string, input: PayInput) => Promise<Payment | undefined>;
  closeTable: (bill: TableBill) => Promise<boolean>;
}

interface CashierViewProps {
  bills: TableBill[];
  collectedToday: number;
  updatedAt: string;
  actions: CashierActions;
  config: CheckoutConfig;
  /** ให้ส่วนลดได้ (สิทธิ์ cashier.discount ของผู้ใช้ปัจจุบัน) */
  canDiscount?: boolean;
}

/** รอชำระขึ้นก่อน และในกลุ่มเดียวกันโต๊ะที่เปิดนานที่สุดขึ้นก่อน */
function rank(bill: TableBill) {
  return isDue(bill) ? 0 : bill.payment ? 1 : 2;
}

function byPriority(a: TableBill, b: TableBill) {
  return rank(a) - rank(b) || a.openedAtMs - b.openedAtMs;
}

/**
 * จอคิดเงิน (ไม่ดึงข้อมูลเอง รับบิลและ actions จาก CashierWorkspace จึงใช้เรนเดอร์เป็น skeleton ได้): ซ้ายเลือกโต๊ะ ขวาเป็นบิลที่พอดีหนึ่งหน้าจอ กด "เงินสด" หรือ "โอนเงิน" แล้วเปิดหน้าต่างรับเงิน
 * ชำระเสร็จ → พิมพ์ใบเสร็จ → ปิดโต๊ะ → บิลโต๊ะรอชำระถัดไปขึ้นเอง
 * จอเล็กจะเปิดบิลเป็นหน้าต่างเต็มจอแทน ยอดทุกบาทถูกคำนวณซ้ำและบันทึกที่ server ตอนรับชำระ
 */
export function CashierView({
  bills,
  collectedToday,
  updatedAt,
  actions,
  config,
  canDiscount = true,
}: CashierViewProps) {
  const desktop = useIsDesktop();
  const live = useSocketConnected();
  const [paying, setPaying] = useState(false);
  const [view, setView] = useState<TableView>("due");
  const [zone, setZone] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<CheckoutState | null>(null);
  /** ใบเสร็จที่กำลังพิมพ์ (เก็บสำเนาบิลไว้ เพราะปิดโต๊ะหลังพิมพ์เสร็จ) */
  const [printJob, setPrintJob] = useState<{
    bill: TableBill;
    close: boolean;
  } | null>(null);

  const stats = useMemo(() => {
    const due = bills.filter(isDue);
    return {
      dueCount: due.length,
      dueAmount: due.reduce((sum, bill) => sum + billTotal(bill, config), 0),
      collected: collectedToday,
    };
  }, [bills, config, collectedToday]);

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return bills
      .filter((bill) => view === "all" || isDue(bill))
      .filter((bill) => !zone || bill.zone === zone)
      .filter(
        (bill) =>
          !keyword ||
          bill.tableName.toLowerCase().includes(keyword) ||
          bill.zone.toLowerCase().includes(keyword),
      )
      .sort(byPriority);
  }, [bills, view, query, zone]);

  const zones = useMemo(() => [...new Set(bills.map((bill) => bill.zone))], [bills]);
  const selected = bills.find((bill) => bill.tableId === selectedId) ?? null;
  const checkoutBill =
    bills.find((bill) => bill.tableId === checkout?.tableId) ?? null;
  const firstDue = [...bills].filter(isDue).sort(byPriority)[0];

  function startPay(method: CheckoutMethod, totals: BillTotals) {
    if (selected) setCheckout({ tableId: selected.tableId, method, totals });
  }

  async function pay(tableId: string, payment: Payment) {
    if (paying) return;
    setPaying(true);
    const saved = await actions.pay(tableId, {
      method: payment.method,
      discount: payment.discount,
      received: payment.received,
    });
    setPaying(false);
    if (saved) {
      const bill = bills.find((item) => item.tableId === tableId);
      notify.success(
        `รับชำระ ${bill?.tableName ?? "โต๊ะ"} แล้ว`,
        `${saved.method === "cash" ? "เงินสด" : "โอนเงิน"} ฿${saved.total.toLocaleString("th-TH")}`,
      );
    }
  }

  async function closeTable(bill: TableBill) {
    const next = bills
      .filter((item) => isDue(item) && item.tableId !== bill.tableId)
      .sort(byPriority)[0];
    if (!(await actions.closeTable(bill))) return;
    // จอใหญ่: กระโดดไปโต๊ะรอชำระถัดไปทันที จอเล็ก: กลับไปรายการโต๊ะ
    setSelectedId(desktop ? (next?.tableId ?? null) : null);
    notify.success(`ปิด${bill.tableName} แล้ว`, "โต๊ะพร้อมรับลูกค้ากลุ่มถัดไป");
  }

  function finish(bill: TableBill, action: FinishAction) {
    setCheckout(null);
    if (action === "close-only" || !bill.payment) closeTable(bill);
    else setPrintJob({ bill, close: action === "print-close" });
  }

  function printDone() {
    if (!printJob) return;
    if (printJob.close) closeTable(printJob.bill);
    else
      notify.success(
        `พิมพ์ใบเสร็จ ${printJob.bill.tableName} แล้ว`,
        "โต๊ะยังไม่ปิด กดปิดโต๊ะได้ที่บิลฝั่งขวา",
      );
    setPrintJob(null);
  }

  const panel = selected && (
    <BillPanel
      key={selected.tableId}
      bill={selected}
      config={config}
      canDiscount={canDiscount}
      onPay={startPay}
      onFinish={finish}
    />
  );

  return (
    <div className="pos-viewport flex w-full flex-col gap-4 overflow-hidden">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-foreground text-2xl leading-tight font-semibold">
            คิดเงิน
          </h1>
          <p
            role="status"
            className={cn(
              "flex items-center gap-1.5 text-xs",
              live ? "text-success-strong" : "text-muted-foreground",
            )}
          >
            <span
              aria-hidden
              className={cn("size-2 rounded-full", live ? "bg-success" : "bg-muted-foreground/50")}
            />
            {live ? "อัปเดตสด" : "ขาดการเชื่อมต่อ รีเฟรชหน้าเพื่อโหลดล่าสุด"}
            <span className="text-muted-foreground hidden xl:inline">• {updatedAt}</span>
          </p>
        </div>
        <CashierStats
          dueTables={stats.dueCount}
          dueAmount={stats.dueAmount}
          collectedToday={stats.collected}
        />
      </div>

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px]">
        <TableList
          bills={visible}
          config={config}
          view={view}
          query={query}
          dueCount={stats.dueCount}
          totalCount={bills.length}
          selectedId={selectedId}
          zones={zones}
          zone={zone}
          onZoneChange={setZone}
          onViewChange={setView}
          onQueryChange={setQuery}
          onSelect={(bill) => setSelectedId(bill.tableId)}
        />

        {desktop && (
          <aside aria-label="บิลของโต๊ะที่เลือก" className="min-h-0">
            {panel ?? (
              <EmptyPane
                disabled={!firstDue}
                onStart={() => firstDue && setSelectedId(firstDue.tableId)}
              />
            )}
          </aside>
        )}
      </div>

      {!desktop && (
        <Dialog
          open={selected !== null}
          title={selected ? `คิดเงิน ${selected.tableName}` : "คิดเงิน"}
          onClose={() => setSelectedId(null)}
          className="bg-background w-[min(100vw,480px)] sm:w-[min(96vw,480px)]"
        >
          <div className="h-[min(88dvh,780px)] p-3 pt-14">{panel}</div>
        </Dialog>
      )}

      <CheckoutModal
        checkout={checkout}
        bill={checkoutBill}
        config={config}
        onSwitchMethod={(method) =>
          setCheckout((prev) => (prev ? { ...prev, method } : prev))
        }
        onPaid={pay}
        onFinish={finish}
        onClose={() => setCheckout(null)}
      />

      {printJob?.bill.payment && (
        <ReceiptSheet
          bill={printJob.bill}
          payment={printJob.bill.payment}
          config={config}
          onDone={printDone}
        />
      )}
    </div>
  );
}

function EmptyPane({
  disabled,
  onStart,
}: {
  disabled: boolean;
  onStart: () => void;
}) {
  return (
    <div className="border-border flex h-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-8 py-12 text-center">
      <span className="bg-primary-soft text-primary-strong flex size-14 items-center justify-center rounded-full">
        <ReceiptText className="size-7" aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-foreground text-[15px] font-semibold">
          เลือกโต๊ะเพื่อเริ่มคิดเงิน
        </p>
        <p className="text-muted-foreground text-[13px]">
          กดที่โต๊ะทางซ้าย บิลและปุ่มรับเงินจะขึ้นที่นี่
        </p>
      </div>
      <Button variant="secondary" disabled={disabled} onClick={onStart}>
        เริ่มจากโต๊ะที่รอนานที่สุด
      </Button>
    </div>
  );
}
