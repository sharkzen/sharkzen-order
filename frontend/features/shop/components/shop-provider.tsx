"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { billingApi, type Subscription } from "@/features/billing/lib/billing-api";
import { authApi, type SessionUser } from "@/features/auth/lib/auth-api";
import {
  shopApi,
  type AppNotification,
  type Shop,
} from "@/features/shop/lib/shop-api";
import { playAlert } from "@/features/kitchen-display/lib/sound";
import { useResource } from "@/hooks/use-resource";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { clientHttp } from "@/lib/http/client";
import { ApiError } from "@/lib/http/api-error";
import { ROUTES } from "@/constants/routes";
import { notify } from "@/lib/toast";
import { SocketEvent } from "@/lib/socket";

interface ShopContextValue {
  user?: SessionUser;
  shop?: Shop;
  /** แพ็กเกจที่สมัครอยู่ (แสดงที่แถบข้างและหน้าแพ็กเกจ) */
  subscription?: Subscription;
  setSubscription: (subscription: Subscription) => void;
  notifications: AppNotification[];
  unread: number;
  /** ยังมีการแจ้งเตือนเก่ากว่านี้ให้โหลดเพิ่ม */
  hasMoreNotifications: boolean;
  loadingMoreNotifications: boolean;
  loadMoreNotifications: () => Promise<void>;
  /** ออเดอร์ใหม่ที่ครัวยังไม่รับ แสดงเป็นตัวเลขที่เมนูคำสั่งซื้อ */
  newOrders: number;
  /** กำลังสลับเปิด-ปิดร้าน */
  toggling: boolean;
  setShop: (shop: Shop) => void;
  setOpen: (isOpen: boolean) => Promise<void>;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const ShopContext = createContext<ShopContextValue | null>(null);

export function useShop() {
  const value = useContext(ShopContext);
  if (!value) throw new Error("useShop ต้องใช้ภายใน ShopProvider");
  return value;
}

/**
 * ข้อมูลกลางของพื้นที่จัดการร้าน: ผู้ใช้ ร้าน (รวมสถานะเปิด-ปิด) และการแจ้งเตือน
 * อัปเดตสดผ่าน Socket.IO ทุกแท็บของร้านเดียวกันเห็นตรงกัน
 */
export function ShopProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser>();
  const [shop, setShop] = useState<Shop>();
  const [subscription, setSubscription] = useState<Subscription>();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(false);
  const [loadingMoreNotifications, setLoadingMoreNotifications] = useState(false);
  const [toggling, setToggling] = useState(false);
  const { data: activeOrders } = useResource(
    async (signal) =>
      (await clientHttp.get<{ status: string }[]>("/orders", { params: { active: true }, signal })).data,
    { refetchOn: [SocketEvent.OrderCreated, SocketEvent.OrderUpdated] },
  );
  const newOrders = activeOrders?.filter((order) => order.status === "NEW").length ?? 0;

  useEffect(() => {
    const goLogin = (e: unknown) => {
      if (e instanceof ApiError && e.status === 401) router.replace(ROUTES.login);
    };
    authApi.me().then(({ data }) => {
      setUser(data.user);
      // ผู้ดูแลระบบไม่มีร้านของตัวเอง พาไปพื้นที่ผู้ดูแลระบบ
      if (data.user.role === "ADMIN") router.replace(ROUTES.admin);
      // พนักงานที่ยังใช้รหัสผ่านตั้งต้นต้องเปลี่ยนก่อน
      if (data.user.role === "STAFF" && data.user.mustChangePassword) router.replace(ROUTES.staffPassword);
    }, goLogin);
    shopApi.get().then(({ data }) => setShop(data), goLogin);
    billingApi.overview().then(({ subscription: sub }) => setSubscription(sub), () => undefined);
    shopApi.notifications().then(({ data }) => {
      setNotifications(data.items);
      setUnread(data.unread);
      setHasMoreNotifications(data.hasMore);
    }, goLogin);
  }, [router]);

  useSocketEvent<Shop>(SocketEvent.ShopUpdated, setShop);

  // ผู้ดูแลระบบแบนบัญชี/ระงับร้านขณะใช้งานอยู่: ลองเรียกอีกครั้ง ถ้าถูกบล็อกจะขึ้นหน้าต่างให้ติดต่อผู้ดูแลระบบเอง
  useSocketEvent(SocketEvent.AccessChanged, () => {
    void Promise.allSettled([authApi.me(), shopApi.get()]);
  });

  useSocketEvent<AppNotification>(SocketEvent.NotificationCreated, (item) => {
    // ออเดอร์ใหม่ไม่เข้ากระดิ่ง (ดูที่หน้าคำสั่งซื้อ/ครัว) แต่ยังแจ้งเด้ง/เสียงตามการตั้งค่า
    if (item.type !== "ORDER_NEW") {
      setNotifications((prev) =>
        prev.some((n) => n.id === item.id) ? prev : [item, ...prev],
      );
      setUnread((count) => count + 1);
    }
    if (item.type === "ORDER_NEW" && shop?.newOrderPopup) {
      notify.info(item.title, item.body);
    }
    if (item.type === "ORDER_NEW" && shop?.newOrderSound) {
      try {
        playAlert("chime", 0.7);
      } catch {
        // เบราว์เซอร์ยังไม่อนุญาตเล่นเสียงจนกว่าผู้ใช้จะกดอะไรสักครั้ง
      }
    }
  });

  const setOpen = useCallback(async (isOpen: boolean) => {
    setToggling(true);
    try {
      const { data } = await shopApi.setOpen(isOpen);
      setShop(data);
      notify.success(
        isOpen ? "เปิดรับออเดอร์แล้ว" : "ปิดรับออเดอร์แล้ว",
        isOpen ? "ลูกค้าสแกน QR สั่งอาหารได้" : "ลูกค้าจะสั่งอาหารไม่ได้จนกว่าจะเปิดร้านอีกครั้ง",
      );
    } catch (e) {
      notify.error(e);
    } finally {
      setToggling(false);
    }
  }, []);

  const loadMoreNotifications = useCallback(async () => {
    const last = notifications.at(-1);
    if (!last || loadingMoreNotifications) return;
    setLoadingMoreNotifications(true);
    try {
      const { data } = await shopApi.notifications(last.id);
      setNotifications((prev) => [...prev, ...data.items.filter((n) => !prev.some((p) => p.id === n.id))]);
      setHasMoreNotifications(data.hasMore);
    } catch (e) {
      notify.error(e);
    } finally {
      setLoadingMoreNotifications(false);
    }
  }, [notifications, loadingMoreNotifications]);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((count) => Math.max(0, count - 1));
    shopApi.readNotification(id).catch(() => undefined);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    shopApi.readAllNotifications().catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({
      user,
      shop,
      subscription,
      setSubscription,
      notifications,
      unread,
      hasMoreNotifications,
      loadingMoreNotifications,
      loadMoreNotifications,
      newOrders,
      toggling,
      setShop,
      setOpen,
      markRead,
      markAllRead,
    }),
    [user, shop, subscription, notifications, unread, hasMoreNotifications, loadingMoreNotifications, loadMoreNotifications, newOrders, toggling, setOpen, markRead, markAllRead],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}
