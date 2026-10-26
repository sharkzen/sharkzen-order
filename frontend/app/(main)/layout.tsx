import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main className="flex-1 py-8">{children}</main>
      <Footer />
    </>
  );
}
