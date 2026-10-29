import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui";
import { ROUTES } from "@/constants/routes";

export function Cta({ trialDays }: { trialDays?: number }) {
  return (
    <section className="bg-primary flex min-h-[calc(100vh-88px)] flex-col items-center justify-center gap-5 px-5 py-16 text-center text-white md:px-12 lg:px-24">
      <h2 className="font-display text-[28px] leading-[1.4] font-semibold md:text-[38px]">
        พร้อมให้ร้านคล่องขึ้นตั้งแต่มื้อถัดไป?
      </h2>
      <p className="text-base">
        เริ่มต้นวันนี้ ให้เราช่วยเปลี่ยนงานวุ่น ๆ เป็นประสบการณ์ที่ดีของลูกค้า
      </p>
      <Link
        href={ROUTES.register}
        className={buttonVariants({ variant: "outline" })}
      >
        <ArrowRight className="size-[18px]" aria-hidden />
        {trialDays ? `ทดลองใช้งานฟรี ${trialDays} วัน` : "ทดลองใช้งานฟรี"}
      </Link>
      <p className="text-xs">ไม่ต้องใช้บัตรเครดิต • มีทีมงานช่วยเริ่มต้น</p>
    </section>
  );
}
