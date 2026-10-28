import { Download, ExternalLink, ReceiptText } from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/ui";
import { formatBaht } from "@/features/landing/data";
import type { Invoice } from "@/features/billing/lib/billing-api";
import { formatDate } from "@/features/billing/lib/plan-status";

const STATUS: Record<
  NonNullable<Invoice["status"]>,
  { label: string; tone: "success" | "warning" | "danger" | "neutral" }
> = {
  paid: { label: "ชำระแล้ว", tone: "success" },
  open: { label: "รอชำระ", tone: "warning" },
  draft: { label: "ฉบับร่าง", tone: "neutral" },
  uncollectible: { label: "เก็บเงินไม่ได้", tone: "danger" },
  void: { label: "ยกเลิก", tone: "neutral" },
};

/** ประวัติการชำระเงินและใบแจ้งหนี้ของแพ็กเกจ */
export function InvoicesCard({ invoices }: { invoices: Invoice[] }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col gap-1 p-[22px] pb-4">
        <h2 className="text-foreground text-base font-semibold">
          ประวัติการชำระเงิน
        </h2>
      </div>
      {invoices.length === 0 ? (
        <EmptyState
          icon={<ReceiptText className="size-6" aria-hidden />}
          title="ยังไม่มีประวัติการชำระเงิน"
          description="เมื่อสมัครแพ็กเกจและมีการตัดเงิน ใบแจ้งหนี้จะแสดงที่นี่"
        />
      ) : (
        <ul className="border-border divide-border divide-y border-t">
          {invoices.map((invoice) => {
            const status = invoice.status
              ? STATUS[invoice.status]
              : STATUS.draft;
            return (
              <li
                key={invoice.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-[22px] py-3.5"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="text-foreground text-[13px] font-medium">
                    {invoice.description ?? invoice.number ?? "ใบแจ้งหนี้"}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(invoice.date)}
                    {invoice.number ? ` • ${invoice.number}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-foreground text-sm font-semibold tabular-nums">
                    ฿{formatBaht(invoice.amount)}
                  </span>
                  <Badge tone={status.tone}>{status.label}</Badge>
                  <div className="flex items-center gap-1">
                    {invoice.pdfUrl && (
                      <a
                        href={invoice.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`ดาวน์โหลดใบแจ้งหนี้ ${invoice.number ?? ""}`}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-primary/50 flex size-9 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none"
                      >
                        <Download className="size-4" aria-hidden />
                      </a>
                    )}
                    {invoice.hostedUrl && (
                      <a
                        href={invoice.hostedUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={invoice.pdfUrl ? `เปิดใบแจ้งหนี้ ${invoice.number ?? ""}` : "เปิดใบเสร็จ"}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-primary/50 flex size-9 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none"
                      >
                        <ExternalLink className="size-4" aria-hidden />
                      </a>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
