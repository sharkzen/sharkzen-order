"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, SearchX, Store } from "lucide-react";
import { Badge, Button, Card, EmptyState, Input, Pagination, Select, Skeleton } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { useResource } from "@/hooks/use-resource";
import { notify } from "@/lib/toast";
import { adminApi, type AdminShop, type Paged } from "../lib/admin-api";
import { formatDate } from "../lib/format";
import { PageTitle } from "./page-title";
import { ReasonDialog } from "./reason-dialog";
import { BannedBadge, SuspendedBadge } from "./user-badges";

const STATUS_OPTIONS = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "open", label: "เปิดรับออเดอร์" },
  { value: "closed", label: "ปิดร้านอยู่" },
  { value: "suspended", label: "ถูกระงับ" },
];

const PLACEHOLDER: Paged<AdminShop> = {
  total: 5,
  page: 1,
  pageSize: 15,
  items: Array.from({ length: 5 }, (_, i) => ({
    id: String(i),
    name: "ชื่อร้านตัวอย่าง",
    branch: "",
    isOpen: true,
    suspended: false,
    suspendReason: "",
    createdAt: "2026-01-01T00:00:00Z",
    tables: 5,
    staff: 2,
    orders: 100,
    owner: { id: "x", email: "sample@example.com", name: "ชื่อตัวอย่าง", banned: false },
  })),
};

function useDebounced(value: string, ms = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function ShopsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<AdminShop>();
  const q = useDebounced(search);

  const { data, error, loading, reload } = useResource((signal) => adminApi.shops({ q, status, page }, signal), {
    key: `${q}|${status}|${page}`,
  });
  const view = data ?? PLACEHOLDER;
  const filtered = q !== "" || status !== "all";

  async function suspend(reason: string) {
    if (!target) return;
    try {
      await adminApi.suspendShop(target.id, reason);
      notify.success("ระงับร้านแล้ว", "เจ้าของ พนักงาน และลูกค้าหน้าโต๊ะของร้านนี้ใช้งานไม่ได้");
      setTarget(undefined);
      reload();
    } catch (e) {
      notify.error(e);
    }
  }

  async function unsuspend(shop: AdminShop) {
    try {
      await adminApi.unsuspendShop(shop.id);
      notify.success("ปลดระงับร้านแล้ว");
      reload();
    } catch (e) {
      notify.error(e);
    }
  }

  const rows = (
    <ul className="divide-border divide-y">
      {view.items.map((shop) => (
        <li
          key={shop.id}
          className="grid grid-cols-1 items-center gap-x-4 gap-y-2.5 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_minmax(0,1.2fr)_110px_150px]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="bg-primary-soft text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
              <Store className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-foreground truncate text-sm font-semibold">{shop.name}</p>
              <p className="text-muted-foreground truncate text-xs">
                {shop.branch ? `สาขา${shop.branch}` : "สาขาหลัก"} · สร้างเมื่อ {formatDate(shop.createdAt)}
              </p>
            </div>
          </div>

          <div className="min-w-0 text-xs">
            <Link
              href={`${ROUTES.adminUsers}?user=${shop.owner.id}`}
              className="text-primary-strong block truncate text-sm font-medium hover:underline"
            >
              {shop.owner.name || shop.owner.email}
            </Link>
            <span className="text-muted-foreground block truncate">{shop.owner.email}</span>
          </div>

          <p className="text-muted-foreground text-xs">
            {shop.tables} โต๊ะ · {shop.staff} พนักงาน
            <span className="block">{shop.orders.toLocaleString("en-US")} ออเดอร์</span>
          </p>

          <div className="flex flex-wrap gap-1.5">
            {shop.owner.banned && <BannedBadge />}
            {shop.suspended ? <SuspendedBadge /> : <Badge tone={shop.isOpen ? "success" : "neutral"}>{shop.isOpen ? "เปิดอยู่" : "ปิดร้าน"}</Badge>}
          </div>

          <div className="lg:text-right">
            {shop.suspended ? (
              <Button size="sm" variant="secondary" onClick={() => unsuspend(shop)}>
                ปลดระงับ
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="text-danger-strong border-danger/30 hover:bg-danger-soft" onClick={() => setTarget(shop)}>
                ระงับร้าน
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <PageTitle title="ร้านค้า" description="ดูทุกร้านและทุกสาขาในระบบ ระงับหรือปลดระงับเฉพาะสาขาได้โดยไม่กระทบสาขาอื่นของเจ้าของ" />

      <Card className="flex flex-col gap-0 overflow-hidden p-0">
        <div className="border-border flex flex-col gap-3 border-b p-4 sm:p-5 lg:flex-row">
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="ค้นหาชื่อร้าน สาขา หรืออีเมลเจ้าของ"
              aria-label="ค้นหาร้าน"
              className="h-[46px] pl-9"
            />
          </div>
          <div className="lg:w-[200px]">
            <Select size="lg" aria-label="กรองตามสถานะ" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={STATUS_OPTIONS} />
          </div>
        </div>

        <div className="text-muted-foreground border-border hidden grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_minmax(0,1.2fr)_110px_150px] gap-x-4 border-b px-5 py-2.5 text-xs font-medium lg:grid">
          <span>ร้าน/สาขา</span>
          <span>เจ้าของ</span>
          <span>การใช้งาน</span>
          <span>สถานะ</span>
          <span className="text-right">จัดการ</span>
        </div>

        {error ? (
          <EmptyState icon={<SearchX className="size-6" aria-hidden />} title="โหลดรายการร้านไม่สำเร็จ" description={error} actionLabel="ลองใหม่" onAction={reload} />
        ) : loading ? (
          <Skeleton>{rows}</Skeleton>
        ) : view.items.length === 0 ? (
          <EmptyState
            icon={<SearchX className="size-6" aria-hidden />}
            title="ไม่พบร้าน"
            description={filtered ? "ไม่มีร้านตรงกับตัวกรองที่เลือก" : "ยังไม่มีร้านในระบบ"}
            actionLabel={filtered ? "ล้างตัวกรอง" : undefined}
            onAction={() => {
              setSearch("");
              setStatus("all");
              setPage(1);
            }}
          />
        ) : (
          rows
        )}

        {view.items.length > 0 && !loading && (
          <Pagination
            page={view.page}
            pageCount={Math.max(1, Math.ceil(view.total / view.pageSize))}
            from={(view.page - 1) * view.pageSize + 1}
            to={(view.page - 1) * view.pageSize + view.items.length}
            total={view.total}
            onChange={setPage}
          />
        )}
      </Card>

      <ReasonDialog
        open={target !== undefined}
        title="ระงับร้านนี้?"
        description={`${target?.name ?? ""} ${target?.branch ? `สาขา${target.branch}` : ""} จะใช้งานไม่ได้ทันที ลูกค้าสแกน QR สั่งอาหารไม่ได้ ส่วนสาขาอื่นของเจ้าของคนเดียวกันยังใช้ได้ตามปกติ`}
        confirmLabel="ยืนยันระงับ"
        onClose={() => setTarget(undefined)}
        onConfirm={suspend}
      />
    </>
  );
}
