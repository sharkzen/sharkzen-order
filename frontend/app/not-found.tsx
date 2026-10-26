import Link from "next/link";
import { Button } from "@/components/ui";
import { ROUTES } from "@/constants/routes";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
      <h1 className="text-3xl font-bold">ไม่พบหน้าที่ค้นหา</h1>
      <Link href={ROUTES.home}>
        <Button>กลับหน้าแรก</Button>
      </Link>
    </main>
  );
}
