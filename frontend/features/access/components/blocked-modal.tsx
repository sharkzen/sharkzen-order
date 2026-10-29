"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, MessageCircle, Phone, ShieldAlert } from "lucide-react";
import { Button, Dialog } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { BLOCKED_EVENT, type BlockedDetail } from "@/lib/http/blocked";
import { clientHttp } from "@/lib/http/client";

interface Support {
  email: string;
  phone: string;
  line: string;
}

const COPY = {
  ACCOUNT_BANNED: {
    title: "บัญชีของคุณถูกระงับการใช้งาน",
    body: "ตอนนี้เข้าใช้งานระบบไม่ได้ ทั้งเจ้าของร้าน พนักงาน และการสั่งอาหารของลูกค้าที่โต๊ะ กรุณาติดต่อผู้ดูแลระบบเพื่อตรวจสอบและขอปลดการระงับ",
  },
  SHOP_SUSPENDED: {
    title: "ร้านนี้ถูกระงับการใช้งาน",
    body: "ร้านนี้ถูกผู้ดูแลระบบระงับ เจ้าของ พนักงาน และการสั่งอาหารของลูกค้าที่โต๊ะใช้งานไม่ได้ กรุณาติดต่อผู้ดูแลระบบเพื่อตรวจสอบและขอปลดการระงับ",
  },
} as const;

/**
 * หน้าต่างแจ้งว่าบัญชี/ร้านถูกระงับ ขึ้นทับทุกหน้าเมื่อ API ตอบ ACCOUNT_BANNED / SHOP_SUSPENDED
 * ในพื้นที่จัดการร้านปิดไม่ได้ (เหลือแค่ออกจากระบบ/ลองใหม่) ส่วนหน้าเข้าสู่ระบบปิดได้
 */
export function BlockedModal() {
  const router = useRouter();
  const [detail, setDetail] = useState<BlockedDetail>();
  const [support, setSupport] = useState<Support>();
  const [leaving, setLeaving] = useState(false);
  /** หน้าเข้าสู่ระบบปิดหน้าต่างได้ (อ่านเส้นทางตอนเกิดเหตุ ไม่ใช้ usePathname เพราะอยู่ใน root layout ต้อง prerender ได้) */
  const [closable, setClosable] = useState(false);

  useEffect(() => {
    const onBlocked = (event: Event) => {
      setClosable(window.location.pathname === ROUTES.login || window.location.pathname === ROUTES.staffLogin);
      setDetail((event as CustomEvent<BlockedDetail>).detail);
    };
    window.addEventListener(BLOCKED_EVENT, onBlocked);
    return () => window.removeEventListener(BLOCKED_EVENT, onBlocked);
  }, []);

  useEffect(() => {
    if (!detail || support) return;
    clientHttp.get<Support>("/public/support").then(({ data }) => setSupport(data), () => undefined);
  }, [detail, support]);

  async function logout() {
    setLeaving(true);
    try {
      await clientHttp.post("/auth/logout");
    } catch {
      // ออกจากระบบไม่สำเร็จก็ยังพาไปหน้าเข้าสู่ระบบ
    }
    setDetail(undefined);
    setLeaving(false);
    router.replace(ROUTES.login);
  }

  const copy = detail ? COPY[detail.code] : COPY.ACCOUNT_BANNED;
  const contacts: { icon: typeof Mail; label: string; value: string; href?: string }[] = [];
  if (support?.email) contacts.push({ icon: Mail, label: "อีเมล", value: support.email, href: `mailto:${support.email}` });
  if (support?.phone) contacts.push({ icon: Phone, label: "โทรศัพท์", value: support.phone, href: `tel:${support.phone.replace(/\s/g, "")}` });
  if (support?.line) contacts.push({ icon: MessageCircle, label: "LINE", value: support.line });

  return (
    <Dialog
      open={detail !== undefined}
      title={copy.title}
      showClose={false}
      onClose={() => closable && setDetail(undefined)}
      className="w-[min(94vw,460px)]"
    >
      <div className="flex flex-col items-center gap-4 px-6 pt-8 pb-6 text-center">
        <span className="bg-danger-soft text-danger flex size-16 items-center justify-center rounded-full">
          <ShieldAlert className="size-8" aria-hidden />
        </span>
        <div className="flex flex-col gap-2">
          <p aria-hidden className="font-display text-foreground text-xl font-semibold">
            {copy.title}
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">{copy.body}</p>
        </div>

        {detail?.reason && (
          <div className="bg-danger-soft w-full rounded-lg px-4 py-3 text-left">
            <p className="text-danger-strong text-xs font-semibold">เหตุผลจากผู้ดูแลระบบ</p>
            <p className="text-foreground mt-0.5 text-sm break-words">{detail.reason}</p>
          </div>
        )}

        {contacts.length > 0 && (
          <ul className="border-border w-full divide-y overflow-hidden rounded-lg border text-left">
            {contacts.map(({ icon: Icon, label, value, href }) => (
              <li key={label} className="flex items-center gap-3 px-4 py-3">
                <Icon className="text-primary size-[18px] shrink-0" aria-hidden />
                <span className="text-muted-foreground w-16 shrink-0 text-xs">{label}</span>
                {href ? (
                  <a href={href} className="text-primary-strong truncate text-sm font-semibold hover:underline">
                    {value}
                  </a>
                ) : (
                  <span className="text-foreground truncate text-sm font-semibold">{value}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-border flex flex-col-reverse gap-3 border-t px-6 py-4 sm:flex-row sm:justify-end">
        {closable ? (
          <Button onClick={() => setDetail(undefined)}>เข้าใจแล้ว</Button>
        ) : (
          <>
            <Button variant="outline" onClick={() => window.location.reload()}>
              ลองอีกครั้ง
            </Button>
            <Button loading={leaving} onClick={logout}>
              ออกจากระบบ
            </Button>
          </>
        )}
      </div>
    </Dialog>
  );
}
