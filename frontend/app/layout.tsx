import type { Metadata } from "next";
import { Kanit, Noto_Sans_Thai } from "next/font/google";
import { MotionProvider } from "@/components/motion/motion-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { env } from "@/config/env";
import { siteConfig } from "@/config/site";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai", "latin"],
});

// ฟอนต์หัวข้อ: Kanit (ตัวหนา มีบุคลิก) คู่กับ Noto Sans Thai สำหรับเนื้อความ
const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["thai", "latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  openGraph: {
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      data-scroll-behavior="smooth"
      className={`${notoSansThai.variable} ${kanit.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ToastProvider />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
