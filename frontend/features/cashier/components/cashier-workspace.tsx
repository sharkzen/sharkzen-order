"use client";

import { useMemo, useState } from "react";
import { ReceiptText } from "lucide-react";
import { Button, Dialog } from "@/components/ui";
import { notify } from "@/lib/toast";
import { COLLECTED_BEFORE, UPDATED_AT } from "../data/bills";
import { billTotal } from "../lib/bill-utils";
import { useIsDesktop } from "../lib/use-desktop";
import type {
  BillTotals,
  CheckoutConfig,
  CheckoutMethod,
  FinishAction,
  Payment,
  TableBill,
} from "../types";
import { BillPanel } from "./bill-panel";
import { CashierStats } from "./cashier-stats";
import { CheckoutModal, type CheckoutState } from "./checkout-modal";
import { ReceiptSheet } from "./receipt-sheet";
import { TableList, type TableView } from "./table-list";

interface CashierWorkspaceProps {
  initialBills: TableBill[];
  config: CheckoutConfig;
  /** ให้ส่วนลดได้ (สิทธิ์ cashier.discount ของผู้ใช้ปัจจุบัน) */
  canDiscount?: boolean;
}

/** รอชำระขึ้นก่อน และในกลุ่มเดียวกันโต๊ะที่เปิดนานที่สุดขึ้นก่อน */
function byPriority(a: TableBill, b: TableBill) {
  return (
    Number(!!a.payment) - Number(!!b.payment) ||
    a.openedAt.localeCompare(b.openedAt)
  );
}

/**
 * จอคิดเงิน: ซ้ายเลือกโต๊ะ ขวาเป็นบิลที่พอดีหนึ่งหน้าจอ กด "เงินสด" หรือ "โอนเงิน" แล้วเปิดหน้าต่างรับเงิน
 * ชำระเสร็จ → พิมพ์ใบเสร็จ → ปิดโต๊ะ → บิลโต๊ะรอชำระถัดไปขึ้นเอง
 * จอเล็กจะเปิดบิลเป็นหน้าต่างเต็มจอแทน สถานะบิลเก็บในหน้านี้ก่อน เมื่อมี API ให้เรียกบันทึกที่ pay / closeTable
 * และเมื่อเชื่อม Stripe ให้รับสถานะชำระเงินจาก webhook แทนการกดยืนยันเอง
 */
export function CashierWorkspace({
  initialBills,
  config,
  canDiscount = true,
}: CashierWorkspaceProps) {
  const desktop = useIsDesktop();
  const [bills, setBills] = useState(initialBills);
  const [view, setView] = useState<TableView>("due");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<CheckoutState | null>(null);
  /** ใบเสร็จที่กำลังพิมพ์ (เก็บสำเนาบิลไว้ เพราะปิดโต๊ะหลังพิมพ์เสร็จ) */
  const [printJob, setPrintJob] = useState<{
    bill: TableBill;
    close: boolean;
  } | null>(null);

  const stats = useMemo(() => {
    const due = bills.filter((bill) => !bill.payment);
    return {
      dueCount: due.length,
      dueAmount: due.reduce((sum, bill) => sum + billTotal(bill, config), 0),
      collected:
        COLLECTED_BEFORE +
        bills.reduce((sum, bill) => sum + (bill.payment?.total ?? 0), 0),
    };
  }, [bills, config]);

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return bills
      .filter((bill) => view === "all" || !bill.payment)
      .filter(
        (bill) =>
          !keyword ||
          bill.tableName.toLowerCase().includes(keyword) ||
          bill.zone.toLowerCase().includes(keyword),
      )
      .sort(byPriority);
  }, [bills, view, query]);

  const selected = bills.find((bill) => bill.tableId === selectedId) ?? null;
  const checkoutBill =
    bills.find((bill) => bill.tableId === checkout?.tableId) ?? null;
  const firstDue = [...bills].filter((b) => !b.payment).sort(byPriority)[0];

  function startPay(method: CheckoutMethod, totals: BillTotals) {
    if (selected) setCheckout({ tableId: selected.tableId, method, totals });
  }

  function pay(tableId: string, payment: Payment) {
    const bill = bills.find((item) => item.tableId === tableId);
    setBills((prev) =>
      prev.map((item) =>
        item.tableId === tableId ? { ...item, payment } : item,
      ),
    );
    notify.success(
      `รับชำระ ${bill?.tableName ?? "โต๊ะ"} แล้ว`,
      `${payment.method === "cash" ? "เงินสด" : "โอนเงิน"} ฿${payment.total.toLocaleString("th-TH")}`,
    );
  }

  function closeTable(bill: TableBill) {
    const next = bills
      .filter((item) => !item.payment && item.tableId !== bill.tableId)
      .sort(byPriority)[0];
    setBills((prev) => prev.filter((item) => item.tableId !== bill.tableId));
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
          <p className="text-muted-foreground hidden text-xs xl:block">
            อัปเดตล่าสุด {UPDATED_AT}
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
