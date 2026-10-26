import { CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui";

interface AccountStatusProps {
  plan: { name: string; validUntil: string };
}

/** สถานะระบบ แพ็กเกจ และปุ่มออกจากระบบ ท้ายแถบนำทาง */
export function AccountStatus({ plan }: AccountStatusProps) {
  return (
    <div className="flex flex-col items-start gap-2.5">
      <Badge tone="success">
        <CircleCheck className="size-[13px]" aria-hidden />
        ระบบทำงานปกติ
      </Badge>
      <p className="text-muted-foreground text-[11px]">
        แพ็กเกจ{plan.name} • ถึง {plan.validUntil}
      </p>
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground focus-visible:ring-primary/50 cursor-pointer rounded text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        ออกจากระบบ
      </button>
    </div>
  );
}
