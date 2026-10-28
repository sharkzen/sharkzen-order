"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { m } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  PiBasketFill,
  PiMagnifyingGlassBold,
  PiQrCodeBold,
  PiWarningFill,
  PiXBold,
} from "react-icons/pi";
import { Button, Spinner } from "@/components/ui";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";
import { toApiError } from "@/lib/http/api-error";
import { notify } from "@/lib/toast";
import {
  customerApi,
  type CustomerMenu,
  type CustomerMenuItem,
  type CustomerOrder as Order,
} from "@/features/customer-order/lib/customer-api";
import {
  resolveLines,
  setLineQuantity,
  upsertLine,
  type CartLine,
} from "@/features/customer-order/lib/cart";
import { CartPanel } from "./cart-panel";
import { ConfirmOrderDialog } from "./confirm-order-dialog";
import { OptionSheet } from "./option-sheet";
import { CartPage } from "./cart-page";
import { ClosedDialog } from "./closed-dialog";
import { MenuCard } from "./menu-card";
import { CallStaffDialog } from "./call-staff-dialog";
import { CustomerNav } from "./customer-nav";

const POLL_MS = 10_000;
const DEFAULT_COVER = "/images/customer/hero.png";

type LoadError = "invalid" | "failed";

/** หน้าสั่งอาหารของลูกค้า: เปิดจาก QR ที่โต๊ะ ร้านและโต๊ะมาจาก token ใน URL */
export function CustomerOrder({ token }: { token: string }) {
  const router = useRouter();
  const [menu, setMenu] = useState<CustomerMenu>();
  const [error, setError] = useState<LoadError | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  /** เมนูที่กำลังเลือกตัวเลือก */
  const [optionItem, setOptionItem] = useState<CustomerMenuItem | null>(null);
  const [note, setNote] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [calling, setCalling] = useState(false);
  const [closedOpen, setClosedOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [chipsAtEnd, setChipsAtEnd] = useState(false);
  const wasOrderable = useRef<boolean | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  /** ตำแหน่งและความกว้างของเส้นใต้แท็บหมวดที่เลือก (วัดจากปุ่มจริง) */
  const [indicator, setIndicator] = useState<{ x: number; width: number } | null>(null);
  const cartKey = `cart:${token.slice(0, 24)}`;

  const categoryCount = menu?.categories.length ?? 0;
  useLayoutEffect(() => {
    const measure = () => {
      const tab = tabsRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
      setIndicator(tab ? { x: tab.offsetLeft, width: tab.offsetWidth } : null);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [category, categoryCount]);

  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const [nextMenu, nextOrders] = await Promise.all([
          customerApi.menu(token, signal),
          customerApi.orders(token, signal),
        ]);
        // ถ้าสั่งได้อยู่แล้วกลายเป็นสั่งไม่ได้ (พนักงานปิดโต๊ะ/ร้านปิดรับ) แจ้งทันที
        if (wasOrderable.current !== false && !nextMenu.canOrder)
          setClosedOpen(true);
        wasOrderable.current = nextMenu.canOrder;
        setMenu(nextMenu);
        setOrders(nextOrders);
        setError(null);
      } catch (e) {
        if (signal?.aborted) return;
        setError((current) =>
          toApiError(e).status === 404 ? "invalid" : (current ?? "failed"),
        );
      }
    },
    [token],
  );

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible")
        void refresh(controller.signal);
    }, POLL_MS);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [refresh]);

  // ตะกร้าไม่หายเมื่อรีเฟรชหน้า (เก็บแยกตามโต๊ะ)
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(
        sessionStorage.getItem(cartKey) ?? "[]",
      );
      if (Array.isArray(saved)) setCart(saved as CartLine[]);
    } catch {}
  }, [cartKey]);
  useEffect(() => {
    try {
      sessionStorage.setItem(cartKey, JSON.stringify(cart));
    } catch {}
  }, [cart, cartKey]);

  const visibleItems = useMemo(() => {
    const text = query.trim().toLowerCase();
    return (menu?.items ?? []).filter(
      (item) =>
        (!category || item.categoryId === category) &&
        (!text ||
          `${item.name} ${item.description}`.toLowerCase().includes(text)),
    );
  }, [menu, query, category]);

  const lines = useMemo(
    () => resolveLines(menu?.items ?? [], cart),
    [menu, cart],
  );
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  // ลดจนตะกร้าว่างในหน้ายืนยัน → ปิดหน้ายืนยันเอง
  useEffect(() => {
    if (confirmOpen && cart.length === 0) setConfirmOpen(false);
  }, [confirmOpen, cart.length]);
  const inCart = (itemId: string) =>
    lines
      .filter((line) => line.item.id === itemId)
      .reduce((sum, line) => sum + line.quantity, 0);
  const inProgress = orders.filter(
    (o) => o.status !== "SERVED" && o.status !== "CANCELLED",
  ).length;

  /** เมนูที่ไม่มีตัวเลือก: ตั้งจำนวนตรงๆ */
  function setSimple(itemId: string, quantity: number) {
    setCart((current) => upsertLine(current, itemId, [], quantity, true));
  }

  function setLine(key: string, quantity: number) {
    setCart((current) => setLineQuantity(current, key, quantity));
  }

  function setLineNote(key: string, note: string) {
    setCart((current) =>
      current.map((line) => (line.key === key ? { ...line, note } : line)),
    );
  }

  function addWithOptions(
    item: CustomerMenuItem,
    optionIds: string[],
    quantity: number,
    note: string,
  ) {
    setCart((current) =>
      upsertLine(current, item.id, optionIds, quantity, false, note),
    );
    setOptionItem(null);
  }

  async function callStaff() {
    setCalling(true);
    try {
      await customerApi.callStaff(token);
      setCallOpen(false);
      notify.success("เรียกพนักงานแล้ว", "พนักงานจะมาที่โต๊ะของคุณเร็วๆ นี้");
    } catch (e) {
      notify.error(e);
    } finally {
      setCalling(false);
    }
  }

  async function submit() {
    if (!lines.length || submitting) return;
    setSubmitting(true);
    try {
      const placed = await customerApi.placeOrder(token, {
        items: lines.map(({ item, optionIds, quantity, note: lineNote }) => ({
          menuItemId: item.id,
          quantity,
          options: optionIds,
          note: lineNote.trim(),
        })),
        notes: note.trim() ? [note.trim()] : [],
      });
      setCart([]);
      setNote("");
      setCartOpen(false);
      notify.success(`ส่งออเดอร์ #${placed.number} เข้าครัวแล้ว`);
      router.push(`/t/${token}/orders`);
    } catch (e) {
      const { code } = toApiError(e);
      if (code === "SHOP_CLOSED" || code === "TABLE_CLOSED") {
        setCartOpen(false);
        setClosedOpen(true);
        await refresh();
      } else {
        notify.error(e);
        if (code === "MENU_UNAVAILABLE" || code === "MENU_NOT_FOUND")
          await refresh();
      }
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  }

  if (error && !menu) {
    return (
      <Notice
        icon={
          error === "invalid" ? (
            <PiQrCodeBold className="size-7" />
          ) : (
            <PiWarningFill className="size-7" />
          )
        }
        title={error === "invalid" ? "QR นี้ใช้ไม่ได้" : "เปิดเมนูไม่สำเร็จ"}
        body={
          error === "invalid"
            ? "ไม่พบโต๊ะจากลิงก์นี้ ลองสแกน QR ที่โต๊ะใหม่อีกครั้ง หรือเรียกพนักงาน"
            : "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่"
        }
        action={
          error === "failed" ? (
            <Button onClick={() => void refresh()}>ลองใหม่</Button>
          ) : undefined
        }
      />
    );
  }

  if (!menu) {
    return (
      <div
        role="status"
        aria-label="กำลังโหลดเมนู"
        className="flex min-h-dvh items-center justify-center"
      >
        <Spinner className="text-primary size-8" />
      </div>
    );
  }

  const status =
    menu.blocked === "SHOP_CLOSED"
      ? { tone: "danger" as const, label: "ปิดรับออเดอร์" }
      : menu.blocked === "TABLE_CLOSED"
        ? {
            tone: "warning" as const,
            label: "โต๊ะยังไม่เปิด",
          }
        : { tone: "success" as const, label: "เปิดอยู่" };
  const available = menu.items.filter((item) => item.available).length;
  const info = [
    menu.shop.branch,
    menu.table.zone,
    menu.shop.hours && `วันนี้ ${menu.shop.hours}`,
  ]
    .filter(Boolean)
    .join(" • ");
  const cover = menu.shop.coverImage || DEFAULT_COVER;
  /** เมนูแนะนำของร้านแสดงแยกด้านบน เฉพาะตอนดูทุกหมวดและไม่ได้ค้นหา */
  const featuredItems =
    !category && !query.trim()
      ? visibleItems.filter((item) => item.featured)
      : [];
  const renderGrid = (items: CustomerMenuItem[]) => (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
      {items.map((item) => (
        <MenuCard
          key={item.id}
          item={item}
          categoryName={
            menu.categories.find((c) => c.id === item.categoryId)?.name
          }
          quantity={inCart(item.id)}
          canOrder={menu.canOrder}
          onChange={(q) => setSimple(item.id, q)}
          onChoose={() => setOptionItem(item)}
          onBlocked={() => setClosedOpen(true)}
        />
      ))}
    </ul>
  );
  const cartProps = {
    lines,
    total,
    note,
    submitting,
    onNote: setNote,
    onChange: setLine,
    onLineNote: setLineNote,
    // กดสั่งอาหารเลย → ถามยืนยันก่อน ค่อยส่งเข้าครัวจริงเมื่อกดยืนยัน
    onSubmit: () => setConfirmOpen(true),
  };

  return (
    <div className="min-h-dvh pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <header className="bg-surface">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo.svg"
              alt=""
              width={44}
              height={44}
              unoptimized
              className="shrink-0"
            />
            <div className="flex flex-col">
              <span className="font-display text-foreground text-lg leading-tight font-bold tracking-wide">
                {siteConfig.name}
              </span>
              <span className="text-muted-foreground text-xs">
                สั่งปุ๊บ เด้งปั๊บ ถึงครัวทันที
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl md:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-6">
        <div className="min-w-0">
          <div className="relative aspect-[2/1] w-full overflow-hidden sm:aspect-[5/2] md:mt-2 md:rounded-2xl">
            <Image
              src={cover}
              alt=""
              fill
              priority
              unoptimized={cover !== DEFAULT_COVER}
              sizes="(min-width: 1152px) 800px, 100vw"
              className="object-cover"
            />
            <div className="from-foreground/75 via-foreground/40 pointer-events-none absolute inset-0 bg-gradient-to-r to-transparent" />
            <div className="absolute inset-y-0 left-0 flex w-3/4 flex-col justify-center gap-3 px-5 text-white md:px-8">
              <p className="font-display text-2xl leading-tight font-bold md:text-4xl">
                อร่อยทุกเมนู
                <br />
                พร้อมเสิร์ฟถึงโต๊ะคุณ
              </p>
              <p className="text-sm">สั่งง่าย รวดเร็ว ไม่ต้องรอ</p>
            </div>
          </div>

          <section className="bg-surface border-border flex flex-col gap-3 border-b px-4 py-4 md:mt-4 md:rounded-2xl md:border">
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-display text-foreground min-w-0 text-2xl leading-tight font-bold">
                {menu.shop.name}
              </h1>
              <span
                className={cn(
                  "mt-1.5 flex shrink-0 items-center gap-1.5 text-sm font-semibold",
                  status.tone === "success" && "text-success-strong",
                  status.tone === "warning" && "text-warning-strong",
                  status.tone === "danger" && "text-danger-strong",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-2 rounded-full",
                    status.tone === "success" && "bg-success",
                    status.tone === "warning" && "bg-warning",
                    status.tone === "danger" && "bg-danger",
                  )}
                />
                {status.label}
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {menu.table.name}
              {info && ` • ${info}`}
            </p>
            <div className="border-border flex items-center justify-between gap-4 border-t pt-3">
              {menu.canOrder ? (
                <p className="text-muted-foreground text-[13px] leading-snug">
                  เลือกเมนูที่ชอบ แล้วสั่งจากตะกร้าได้เลย
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setClosedOpen(true)}
                  className="text-warning-strong cursor-pointer text-left text-[13px] leading-snug font-medium underline underline-offset-2"
                >
                  ตอนนี้ยังสั่งอาหารไม่ได้
                </button>
              )}
              <button
                type="button"
                onClick={() => setCallOpen(true)}
                className="text-primary-strong focus-visible:ring-primary/50 shrink-0 cursor-pointer rounded text-sm font-semibold underline underline-offset-4 focus-visible:ring-2 focus-visible:outline-none"
              >
                เรียกพนักงาน
              </button>
            </div>
          </section>

          <div className="bg-background/95 sticky top-0 z-10 flex flex-col gap-3 px-4 pt-4 pb-3 backdrop-blur md:px-0">
            <div className="border-border focus-within:border-primary flex h-12 items-center gap-3 border-b-2 px-1 transition-colors">
              <PiMagnifyingGlassBold
                className="text-muted-foreground size-[18px] shrink-0"
                aria-hidden
              />
              <input
                type="text"
                inputMode="search"
                enterKeyHint="search"
                aria-label="ค้นหาเมนู"
                placeholder="ค้นหาเมนู"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="text-foreground placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-[15px] outline-none"
              />
              {query && (
                <button
                  type="button"
                  aria-label="ล้างคำค้นหา"
                  onClick={() => setQuery("")}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors"
                >
                  <PiXBold className="size-4" aria-hidden />
                </button>
              )}
            </div>
            {menu.categories.length > 0 && (
              <div
                ref={tabsRef}
                role="tablist"
                aria-label="หมวดเมนู"
                data-at-end={chipsAtEnd}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  setChipsAtEnd(
                    el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
                  );
                }}
                className="chip-row border-border relative -mx-4 gap-1 border-b px-4 md:mx-0 md:px-0"
              >
                {[{ id: "", name: "ทั้งหมด" }, ...menu.categories].map(
                  ({ id, name }) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={category === id}
                      onClick={(e) => {
                        setCategory(id);
                        e.currentTarget.scrollIntoView({
                          behavior: "smooth",
                          inline: "center",
                          block: "nearest",
                        });
                      }}
                      className={cn(
                        "focus-visible:ring-primary/50 h-11 shrink-0 cursor-pointer px-4 text-sm whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset",
                        category === id
                          ? "text-primary-strong font-bold"
                          : "text-muted-foreground hover:bg-primary-soft hover:text-primary-strong font-medium",
                      )}
                    >
                      {name}
                    </button>
                  ),
                )}
                {indicator && (
                  <m.span
                    aria-hidden
                    className="bg-primary pointer-events-none absolute bottom-[-1px] left-0 h-[3px] rounded-full"
                    initial={false}
                    animate={{ x: indicator.x, width: indicator.width }}
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  />
                )}
              </div>
            )}
          </div>

          <main
            className={cn("flex flex-col gap-4 px-4 pt-3 md:px-0", "pb-28")}
          >
            {featuredItems.length > 0 && (
              <section
                aria-labelledby="featured-title"
                className="bg-primary-soft -mx-4 flex flex-col gap-4 px-4 py-5 md:mx-0 md:rounded-2xl md:px-5"
              >
                <div>
                  <h2
                    id="featured-title"
                    className="font-display text-foreground text-2xl font-bold"
                  >
                    เมนูแนะนำ
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    เมนูขายดีที่ร้านอยากให้ลอง
                  </p>
                </div>
                {renderGrid(featuredItems)}
              </section>
            )}

            <m.section
              key={category}
              className="flex flex-col gap-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-foreground text-2xl font-bold">
                  {category
                    ? (menu.categories.find((c) => c.id === category)?.name ??
                      "เมนู")
                    : query
                      ? "ผลการค้นหา"
                      : "เมนูทั้งหมด"}
                </h2>
                <p className="text-muted-foreground text-xs">
                  {available} เมนูพร้อมเสิร์ฟ
                </p>
              </div>
              {visibleItems.length === 0 ? (
                <p className="text-muted-foreground py-16 text-center text-sm">
                  {menu.items.length === 0
                    ? "ร้านยังไม่มีเมนูให้สั่งในตอนนี้"
                    : "ไม่พบเมนูที่ค้นหา ลองคำอื่นหรือเลือกหมวดอื่น"}
                </p>
              ) : (
                renderGrid(visibleItems)
              )}
            </m.section>
            <p className="text-muted-foreground pt-6 text-center text-xs">
              สั่งอาหารด้วย {siteConfig.name}
            </p>
          </main>
        </div>

        <aside
          aria-label="ตะกร้าของโต๊ะ"
          className="bg-surface border-border shadow-card sticky top-6 mt-6 hidden max-h-[calc(100dvh-3rem)] flex-col gap-4 overflow-y-auto rounded-2xl border p-5 lg:flex"
        >
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-foreground text-xl">
              ตะกร้าของ{menu.table.name}
            </h2>
            {count > 0 && (
              <span className="text-muted-foreground text-xs">
                {count} รายการ
              </span>
            )}
          </div>
          <CartPanel {...cartProps} />
        </aside>
      </div>

      {count > 0 && (
        <button
          type="button"
          onClick={() =>
            menu.canOrder ? setCartOpen(true) : setClosedOpen(true)
          }
          aria-label={`ตะกร้า ${count} รายการ`}
          className="bg-primary text-primary-foreground hover:bg-primary-strong shadow-float focus-visible:ring-primary/50 fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom)+1rem)] z-30 flex size-14 cursor-pointer items-center justify-center rounded-full font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none lg:hidden"
        >
          <span className="relative">
            <PiBasketFill className="size-6" aria-hidden />
            <span className="text-surface absolute -top-2.5 -right-3 flex size-5 items-center justify-center rounded-full text-[11px] font-bold tabular-nums">
              {count}
            </span>
          </span>
        </button>
      )}

      <CustomerNav token={token} active="menu" inProgress={inProgress} />

      <OptionSheet
        item={optionItem}
        onAdd={addWithOptions}
        onClose={() => setOptionItem(null)}
      />
      <CartPage
        open={cartOpen}
        tableName={menu.table.name}
        onClose={() => setCartOpen(false)}
        {...cartProps}
      />
      <ConfirmOrderDialog
        open={confirmOpen}
        lines={lines}
        total={total}
        loading={submitting}
        onChange={setLine}
        onConfirm={() => void submit()}
        onClose={() => setConfirmOpen(false)}
      />
      <CallStaffDialog
        open={callOpen}
        tableName={menu.table.name}
        loading={calling}
        onConfirm={() => void callStaff()}
        onClose={() => setCallOpen(false)}
      />
      <ClosedDialog
        open={closedOpen}
        reason={menu.blocked}
        tableName={menu.table.name}
        onClose={() => setClosedOpen(false)}
      />
    </div>
  );
}

function Notice({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="bg-warning-soft text-warning-strong flex size-14 items-center justify-center rounded-full">
        {icon}
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-foreground text-xl">{title}</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
      </div>
      {action}
    </div>
  );
}
