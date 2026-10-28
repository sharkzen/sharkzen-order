import type { Metadata } from "next";

// หน้าลูกค้าเป็นลิงก์เฉพาะโต๊ะ ไม่ให้ search engine เก็บ
export const metadata: Metadata = {
  title: "สั่งอาหาร",
  robots: { index: false, follow: false },
};

export default function CustomerLayout({ children }: LayoutProps<"/">) {
  return <div className="bg-background min-h-dvh">{children}</div>;
}
