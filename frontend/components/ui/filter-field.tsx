import type { ReactNode } from "react";

interface FilterFieldProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
}

/** ป้ายชื่อเล็กเหนือช่องกรอง */
export function FilterField({ label, htmlFor, children }: FilterFieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={htmlFor} className="text-foreground text-xs font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}
