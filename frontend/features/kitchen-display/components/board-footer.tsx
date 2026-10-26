import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/constants/routes";

export function BoardFooter({ updatedAt }: { updatedAt: string }) {
  return (
    <footer className="text-muted-foreground border-border flex h-9 shrink-0 items-center justify-between gap-3 border-t px-5 text-xs">
      <p>อัปเดตอัตโนมัติ • ล่าสุด {updatedAt} น.</p>
      <Link
        href={ROUTES.dashboard}
        className="text-primary-strong focus-visible:ring-primary/50 flex items-center gap-1.5 rounded hover:underline focus-visible:ring-2 focus-visible:outline-none"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        กลับหน้าจัดการร้าน
      </Link>
    </footer>
  );
}
