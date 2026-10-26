import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Select } from "./select";

/** ช่องเลือกแบบ native พร้อมลูกศรตามดีไซน์ (ซ่อนลูกศรเดิมของเบราว์เซอร์) */
export function FilterSelect({
  className,
  ...props
}: ComponentProps<typeof Select>) {
  return (
    <div className="relative">
      <Select
        className={cn(
          "h-[46px] cursor-pointer appearance-none rounded-lg pr-10 pl-3.5 text-sm",
          className,
        )}
        {...props}
      />
      <ChevronDown
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2"
        aria-hidden
      />
    </div>
  );
}
