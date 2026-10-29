"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SearchX, Search } from "lucide-react";
import { Card, EmptyState, Input, Pagination, Select, Skeleton } from "@/components/ui";
import { useResource } from "@/hooks/use-resource";
import { adminApi, type AdminUser, type Paged } from "../lib/admin-api";
import { countdownLabel, formatDate } from "../lib/format";
import { PageTitle } from "./page-title";
import { UserDrawer } from "./user-drawer";
import { BannedBadge, SubscriptionBadge } from "./user-badges";

const STATUS_OPTIONS = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "active", label: "ใช้งานอยู่" },
  { value: "trialing", label: "ทดลองใช้" },
  { value: "past_due", label: "ค้างชำระ" },
  { value: "canceled", label: "ยกเลิก/หมดอายุ" },
  { value: "nosub", label: "ยังไม่เลือกแพ็กเกจ" },
  { value: "banned", label: "ถูกแบน" },
];

const PLACEHOLDER: Paged<AdminUser> = {
  total: 5,
  page: 1,
  pageSize: 15,
  items: Array.from({ length: 5 }, (_, i) => ({
    id: String(i),
    email: "sample@example.com",
    name: "ชื่อตัวอย่าง",
    verified: true,
    createdAt: "2026-01-01T00:00:00Z",
    banned: false,
    banReason: "",
    shops: 1,
    subscription: null,
  })),
};

/** ค่าที่ใช้กรองหลังหยุดพิมพ์ครู่หนึ่ง กันยิง API ทุกตัวอักษร */
function useDebounced(value: string, ms = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function UsersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [plan, setPlan] = useState("");
  const [page, setPage] = useState(1);
  // ลิงก์จากหน้าอื่น (?user=<id>) เปิดแผงรายละเอียดทันที (หน้านี้แสดงหลังตรวจสิทธิ์ฝั่ง client เท่านั้น จึงอ่าน URL ตอนเริ่มได้เลย)
  const [openId, setOpenId] = useState<string | null>(() => new URLSearchParams(window.location.search).get("user"));
  const q = useDebounced(search);

  const { data: plans = [] } = useResource((signal) => adminApi.plans(signal));
  const { data, error, loading, reload } = useResource((signal) => adminApi.users({ q, status, plan, page }, signal), {
    key: `${q}|${status}|${plan}|${page}`,
  });

  const planOptions = useMemo(
    () => [{ value: "", label: "ทุกแพ็กเกจ" }, ...plans.map((p) => ({ value: p.id, label: p.name }))],
    [plans],
  );
  const closeDrawer = useCallback(() => setOpenId(null), []);

  const view = data ?? PLACEHOLDER;
  const pageCount = Math.max(1, Math.ceil(view.total / view.pageSize));
  const filtered = q !== "" || status !== "all" || plan !== "";

  function resetFilters() {
    setSearch("");
    setStatus("all");
    setPlan("");
    setPage(1);
  }

  const rows = (
    <ul className="divide-border divide-y">
      {view.items.map((user) => (
        <li key={user.id}>
          <button
            type="button"
            onClick={() => setOpenId(user.id)}
            className="hover:bg-muted focus-visible:ring-primary/50 grid w-full cursor-pointer grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset sm:px-5 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_90px_100px]"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span aria-hidden className="bg-primary-soft text-primary-strong flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                {(user.name || user.email).slice(0, 1)}
              </span>
              <span className="min-w-0">
                <span className="text-foreground block truncate text-sm font-semibold">{user.name || "-"}</span>
                <span className="text-muted-foreground block truncate text-xs">{user.email}</span>
              </span>
            </span>

            <span className="flex flex-wrap items-center justify-end gap-1.5 lg:order-3 lg:justify-start">
              {user.banned && <BannedBadge />}
              <SubscriptionBadge subscription={user.subscription} />
            </span>

            <span className="text-muted-foreground col-span-2 text-xs lg:order-2 lg:col-span-1">
              {user.subscription ? (
                <>
                  <span className="text-foreground block text-sm font-medium">
                    {user.subscription.planName} · {user.subscription.billing === "yearly" ? "รายปี" : "รายเดือน"}
                  </span>
                  {countdownLabel(user.subscription.status === "TRIALING" ? user.subscription.trialEndsAt : user.subscription.currentPeriodEnd)}
                </>
              ) : (
                "-"
              )}
            </span>

            <span className="text-muted-foreground hidden text-sm lg:order-4 lg:block">{user.shops} สาขา</span>
            <span className="text-muted-foreground hidden text-xs lg:order-5 lg:block">{formatDate(user.createdAt)}</span>
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <PageTitle title="ผู้ใช้งาน" description="ค้นหาเจ้าของร้าน จัดการแพ็กเกจและวันใช้งาน แบนหรือปลดแบนได้จากที่นี่" />

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
              placeholder="ค้นหาชื่อ อีเมล หรือชื่อร้าน"
              aria-label="ค้นหาผู้ใช้"
              className="h-[46px] pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:w-[360px]">
            <Select size="lg" aria-label="กรองตามสถานะ" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={STATUS_OPTIONS} />
            <Select size="lg" aria-label="กรองตามแพ็กเกจ" value={plan} onChange={(v) => { setPlan(v); setPage(1); }} options={planOptions} />
          </div>
        </div>

        <div className="text-muted-foreground border-border hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_90px_100px] gap-x-4 border-b px-5 py-2.5 text-xs font-medium lg:grid">
          <span>ผู้ใช้</span>
          <span>แพ็กเกจ</span>
          <span>สถานะ</span>
          <span>สาขา</span>
          <span>สมัครเมื่อ</span>
        </div>

        {error ? (
          <EmptyState
            icon={<SearchX className="size-6" aria-hidden />}
            title="โหลดรายชื่อไม่สำเร็จ"
            description={error}
            actionLabel="ลองใหม่"
            onAction={reload}
          />
        ) : loading ? (
          <Skeleton>{rows}</Skeleton>
        ) : view.items.length === 0 ? (
          <EmptyState
            icon={<SearchX className="size-6" aria-hidden />}
            title="ไม่พบผู้ใช้"
            description={filtered ? "ไม่มีผู้ใช้ตรงกับตัวกรองที่เลือก" : "ยังไม่มีผู้ใช้ในระบบ"}
            actionLabel={filtered ? "ล้างตัวกรอง" : undefined}
            onAction={resetFilters}
          />
        ) : (
          rows
        )}

        {view.items.length > 0 && !loading && (
          <Pagination
            page={view.page}
            pageCount={pageCount}
            from={(view.page - 1) * view.pageSize + 1}
            to={(view.page - 1) * view.pageSize + view.items.length}
            total={view.total}
            onChange={setPage}
          />
        )}
      </Card>

      <UserDrawer userId={openId} plans={plans} onClose={closeDrawer} onChanged={reload} />
    </>
  );
}
