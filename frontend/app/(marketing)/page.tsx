import type { Metadata } from "next";
import { Cta } from "@/features/landing/components/cta";
import { Faq } from "@/features/landing/components/faq";
import { Features } from "@/features/landing/components/features";
import { Hero } from "@/features/landing/components/hero/hero";
import { HowItWorks } from "@/features/landing/components/how-it-works";
import { Pricing } from "@/features/landing/components/pricing";
import { ProductPreview } from "@/features/landing/components/product-preview/product-preview";
import { Story } from "@/features/landing/components/story";
import { TrustBar } from "@/features/landing/components/trust-bar";

export const metadata: Metadata = {
  title: {
    absolute: "SHARKZEN ORDER | ระบบสั่งอาหารผ่านคิวอาร์โค้ดสำหรับร้านอาหาร",
  },
  description:
    "เปลี่ยนทุกโต๊ะให้สั่งอาหารได้ด้วยคิวอาร์โค้ด ส่งตรงถึงครัว จัดการร้านครบในหน้าจอเดียว ทดลองฟรี 14 วัน ไม่ต้องใช้บัตรเครดิต",
};

// ทุก section เป็น Server Component — ไม่มี JavaScript ฝั่ง client สำหรับหน้านี้
export default function HomePage() {
  return (
    <>
      {/* TrustBar เป็นแถบบางๆ จึงรวมอยู่ในหน้าจอแรกกับ Hero */}
      <div id="home" className="flex min-h-[calc(100vh-88px)] flex-col">
        <Hero />
        <TrustBar />
      </div>
      <ProductPreview />
      <Features />
      <HowItWorks />
      <Story />
      <Pricing />
      <Faq />
      <Cta />
    </>
  );
}
