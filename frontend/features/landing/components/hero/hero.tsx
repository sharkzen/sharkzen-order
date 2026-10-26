import Link from "next/link";
import { ArrowRight, CircleCheck, Play } from "lucide-react";
import { buttonVariants } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { OrderFlowDemo } from "./order-flow-demo";

export function Hero() {
  return (
    <section className="bg-background relative isolate flex flex-1 items-center overflow-hidden px-5 py-12 md:px-12 lg:px-24">
      <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
      <div className="mx-auto grid w-full max-w-[1248px] items-center gap-12 lg:grid-cols-[1fr_600px] lg:gap-16">
        <div className="flex flex-col items-start gap-6">
          <h1 className="font-display text-foreground text-[40px] leading-[1.3] font-semibold md:text-[56px]">
            สั่งง่าย ร้านคล่อง
            <br />
            อร่อยได้ไม่ต้องรอ
          </h1>
          <p className="text-muted-foreground max-w-[520px] text-[17px]">
            ลูกค้าสแกนคิวอาร์โค้ดสั่งเองที่โต๊ะ ครัวเห็นออร์เดอร์ทันที
            และสรุปยอดตามช่องทางชำระเงินได้ครบในที่เดียว
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={ROUTES.register}
              className={buttonVariants({ size: "lg" })}
            >
              <ArrowRight className="size-[18px]" aria-hidden />
              ทดลองฟรี 14 วัน
            </Link>
            <Link
              href="#preview"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              <Play className="text-primary size-[18px]" aria-hidden />
              ดูหน้าจอจัดการร้าน
            </Link>
          </div>
          <p className="text-muted-foreground flex items-center gap-2 text-xs">
            <CircleCheck className="text-success size-4" aria-hidden />
            ไม่ต้องใช้บัตรเครดิต • ยกเลิกได้ทุกเมื่อ
          </p>
        </div>

        <OrderFlowDemo />
      </div>
    </section>
  );
}
