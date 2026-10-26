import { Clock, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui";
import type { KitchenStatus } from "../types";

interface WaitBadgeProps {
  status: KitchenStatus;
  minutes: number;
  urgent: boolean;
}

/** ป้ายเวลารอของการ์ด: เข้าใหม่ / รอ n นาที / กำลังทำ n นาที / เร่งด่วน / รอเสิร์ฟ n นาที */
export function WaitBadge({ status, minutes, urgent }: WaitBadgeProps) {
  if (urgent) {
    return (
      <Badge tone="danger">
        <TriangleAlert className="size-[13px]" aria-hidden />
        เร่งด่วน • {minutes} นาที
      </Badge>
    );
  }

  const label =
    status === "new"
      ? minutes < 1
        ? "เข้าใหม่"
        : `รอ ${minutes} นาที`
      : status === "preparing"
        ? `กำลังทำ ${minutes} นาที`
        : `รอเสิร์ฟ ${minutes} นาที`;
  const tone =
    status === "new" ? "info" : status === "preparing" ? "warning" : "success";

  return (
    <Badge tone={tone}>
      <Clock className="size-[13px]" aria-hidden />
      {label}
    </Badge>
  );
}
