import { ChevronDown } from "lucide-react";
import type { Account } from "../../types";

export function UserMenu({ account }: { account: Account }) {
  return (
    <button
      type="button"
      className="hover:bg-muted focus-visible:ring-primary/50 flex cursor-pointer items-center gap-2.5 rounded-lg p-1 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <span
        aria-hidden
        className="bg-primary-soft text-primary-strong flex size-9 items-center justify-center rounded-full text-sm font-bold"
      >
        {account.initial}
      </span>
      <span className="hidden flex-col leading-[1.6] md:flex">
        <span className="text-foreground text-[13px] font-semibold">
          {account.name}
        </span>
        <span className="text-muted-foreground text-[11px]">
          {account.role}
        </span>
      </span>
      <ChevronDown
        className="text-muted-foreground hidden size-3.5 md:block"
        aria-hidden
      />
      <span className="sr-only">เมนูบัญชี {account.name}</span>
    </button>
  );
}
