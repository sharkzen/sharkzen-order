import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin } from "lucide-react";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { DEMO_RESTAURANT } from "@/features/landing/data";

const HIGHLIGHTS = [
  { title: "ไม่ต้องติดตั้ง", text: "เปิดผ่านเบราว์เซอร์ได้เลย" },
  { title: "พร้อมทุกอุปกรณ์", text: "มือถือ แท็บเล็ต และคอมพิวเตอร์" },
];

export function Story() {
  return (
    <Section innerClassName="flex flex-col items-center gap-14 lg:flex-row">
      <div className="relative h-[330px] w-full overflow-hidden rounded-3xl lg:w-[484px] lg:shrink-0">
        <Image
          src="/images/landing/restaurant.jpg"
          alt="ร้านอาหารตัวอย่างที่มีโต๊ะไม้และเก้าอี้หวายท่ามกลางสวนเขียว"
          fill
          sizes="(min-width: 1024px) 484px, 100vw"
          className="object-cover"
        />
        <div className="bg-surface absolute bottom-[26px] left-5 flex items-center gap-2 rounded-lg px-4 py-[10px]">
          <MapPin className="text-primary size-[17px]" aria-hidden />
          <span className="text-foreground text-sm font-semibold">
            {DEMO_RESTAURANT.name} • {DEMO_RESTAURANT.branch}
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-start gap-5">
        <Badge tone="info">
          <Heart className="size-[13px]" aria-hidden />
          ออกแบบเพื่อร้านอาหารไทย
        </Badge>
        <h2 className="font-display text-foreground text-[26px] leading-[1.4] font-semibold md:text-[32px]">
          ให้ความใส่ใจอยู่ที่ลูกค้า ไม่ใช่กองกระดาษออร์เดอร์
        </h2>
        <p className="text-muted-foreground max-w-[540px] text-base">
          ตั้งแต่มื้อแรกของวันจนถึงโต๊ะสุดท้าย ทุกคนเห็นข้อมูลเดียวกัน
          ลดการเดินถามซ้ำ และดูแลทุกคำขอพิเศษได้อย่างใส่ใจ
        </p>
        <div className="flex flex-wrap gap-6">
          {HIGHLIGHTS.map((h) => (
            <div key={h.title} className="flex flex-col gap-0.5">
              <p className="font-display text-primary text-[21px] font-semibold">
                {h.title}
              </p>
              <p className="text-muted-foreground text-[13px]">{h.text}</p>
            </div>
          ))}
        </div>
        <Link
          href={ROUTES.login}
          className="text-primary-strong text-sm font-semibold hover:underline"
        >
          ลองดูหน้าสั่งอาหารสำหรับลูกค้า →
        </Link>
      </div>
    </Section>
  );
}
