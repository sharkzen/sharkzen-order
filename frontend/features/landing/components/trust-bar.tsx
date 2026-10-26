import { Flame, Store, Utensils } from "lucide-react";

const SEGMENTS = [
  { icon: Utensils, label: "ร้านอาหารและคาเฟ่" },
  { icon: Flame, label: "ร้านหมูกระทะและชาบู" },
  { icon: Store, label: "ร้านอาหารหลายสาขา" },
];

export function TrustBar() {
  return (
    <section className="border-border bg-surface border-b px-5 py-8 md:px-12 lg:px-24">
      <div className="mx-auto flex max-w-[1248px] flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div className="flex flex-col gap-0.5">
          <p className="text-foreground font-semibold">
            ร้านเล็กหรือร้านใหญ่ ก็พร้อมเติบโต
          </p>
          <p className="text-muted-foreground text-[13px]">
            ออกแบบมาเพื่อจังหวะการทำงานของร้านอาหารไทย
          </p>
        </div>
        {SEGMENTS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-[9px]">
            <Icon className="text-primary size-5" aria-hidden />
            <span className="text-foreground text-sm font-medium">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
