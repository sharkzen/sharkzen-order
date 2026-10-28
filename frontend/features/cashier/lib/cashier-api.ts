import { clientHttp } from "@/lib/http/client";
import type { CheckoutMethod, Payment, TableBill } from "@/features/cashier/types";

interface ApiPayment {
  method: "CASH" | "TRANSFER";
  paidAt: string;
  subtotal: number;
  discount: number;
  serviceCharge: number;
  total: number;
  received: number | null;
  change: number | null;
}

interface ApiBill {
  tableId: string;
  tableName: string;
  zone: string;
  openedAt: string | null;
  rounds: {
    orderId: string;
    number: number;
    createdAt: string;
    served: boolean;
    lines: { name: string; quantity: number; unitPrice: number }[];
  }[];
  payment: ApiPayment | null;
}

const CLOCK: Intl.DateTimeFormatOptions = {
  timeZone: "Asia/Bangkok",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};
const DATE: Intl.DateTimeFormatOptions = {
  timeZone: "Asia/Bangkok",
  day: "numeric",
  month: "short",
  year: "numeric",
};

const clock = (iso: string) => new Date(iso).toLocaleTimeString("th-TH", CLOCK);

export function toPayment(payment: ApiPayment): Payment {
  return {
    method: payment.method === "CASH" ? "cash" : "transfer",
    paidAt: clock(payment.paidAt),
    paidDate: new Date(payment.paidAt).toLocaleDateString("th-TH", DATE),
    subtotal: payment.subtotal,
    discount: payment.discount,
    serviceCharge: payment.serviceCharge,
    total: payment.total,
    ...(payment.received !== null && { received: payment.received }),
    ...(payment.change !== null && { change: payment.change }),
  };
}

const toBill = (bill: ApiBill): TableBill => ({
  tableId: bill.tableId,
  tableName: bill.tableName,
  zone: bill.zone,
  openedAt: bill.openedAt ? clock(bill.openedAt) : "",
  openedAtMs: bill.openedAt ? new Date(bill.openedAt).getTime() : Date.now(),
  lastOrderAtMs: bill.rounds.length
    ? Math.max(...bill.rounds.map((round) => new Date(round.createdAt).getTime()))
    : null,
  rounds: bill.rounds.map((round) => ({
    orderId: round.orderId,
    number: round.number,
    time: clock(round.createdAt),
    lines: round.lines,
    served: round.served,
  })),
  payment: bill.payment ? toPayment(bill.payment) : null,
});

export interface CashierData {
  bills: TableBill[];
  collectedToday: number;
}

export interface PayInput {
  method: CheckoutMethod;
  discount: number;
  received?: number;
}

export const cashierApi = {
  list: (signal?: AbortSignal) =>
    clientHttp
      .get<{ bills: ApiBill[]; collectedToday: number }>("/cashier/bills", { signal })
      .then(({ data }) => ({ bills: data.bills.map(toBill), collectedToday: data.collectedToday })),

  /** รับชำระทั้งโต๊ะ server คำนวณยอดใหม่เองแล้วคืนยอดที่บันทึกจริง */
  pay: (tableId: string, input: PayInput) =>
    clientHttp
      .post<ApiPayment>(`/cashier/tables/${tableId}/pay`, {
        method: input.method === "cash" ? "CASH" : "TRANSFER",
        discount: input.discount,
        received: input.received,
      })
      .then((res) => toPayment(res.data)),
};
