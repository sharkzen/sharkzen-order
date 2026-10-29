import { MessageCircle, Minus, Plus } from "lucide-react";
import { Section } from "@/components/layout/section";
import { buttonVariants } from "@/components/ui";
import Link from "next/link";
import { FAQS } from "@/features/landing/data";

/** {trial} ในคำตอบแทนด้วยจำนวนวันทดลองจริงจากระบบ */
export function Faq({ trialDays }: { trialDays?: number }) {
  const trial = trialDays ? `${trialDays} วัน` : "ตามช่วงเวลาที่ระบบกำหนด";
  return (
    <Section
      id="faq"
      innerClassName="flex flex-col gap-10 lg:flex-row lg:gap-[88px]"
    >
      <div className="flex flex-col items-start gap-[18px] lg:w-[350px] lg:shrink-0">
        <p className="text-primary-strong text-[13px] font-semibold">
          มีคำถาม เราพร้อมตอบ
        </p>
        <h2 className="font-display text-foreground text-[28px] leading-[1.4] font-semibold md:text-4xl">
          เรื่องที่ร้านอาหาร <br className="hidden lg:block" />
          อยากรู้ก่อนเริ่ม
        </h2>
        <p className="text-muted-foreground text-[15px]">
          หากยังไม่พบคำตอบที่ต้องการ <br className="hidden lg:block" />
          ทีมดูแลยินดีช่วยแนะนำทุกขั้นตอน
        </p>
        <Link href="#" className={buttonVariants({ variant: "outline" })}>
          <MessageCircle className="text-foreground size-[18px]" aria-hidden />
          พูดคุยกับทีมงาน
        </Link>
      </div>

      {/* ใช้ <details> ของ HTML — เปิด/ปิดได้โดยไม่ต้องใช้ JavaScript และ crawler อ่านคำตอบได้ครบ */}
      <div className="flex min-w-0 flex-1 flex-col">
        {FAQS.map((item) => (
          <details
            key={item.q}
            open
            className="group border-border border-b py-5"
          >
            <summary className="flex cursor-pointer list-none items-center gap-4 [&::-webkit-details-marker]:hidden">
              <h3 className="font-display text-foreground flex-1 text-[17px] font-semibold">
                {item.q}
              </h3>
              <Minus
                className="text-primary hidden size-[18px] group-open:block"
                aria-hidden
              />
              <Plus
                className="text-primary size-[18px] group-open:hidden"
                aria-hidden
              />
            </summary>
            <p className="text-muted-foreground mt-[10px] text-sm">{item.a.replace("{trial}", trial)}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
