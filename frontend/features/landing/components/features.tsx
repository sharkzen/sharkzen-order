import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { cn } from "@/lib/cn";
import { FEATURES, PAYMENT_METHODS, type Feature } from "../data";

const SPAN_CLASS: Record<Feature["span"], string> = {
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
};

function FeatureCard({ feature }: { feature: Feature }) {
  const { icon: Icon, title, text, span, highlight, tags, id } = feature;

  return (
    <li
      className={cn(
        "flex flex-col gap-4 rounded-xl border p-7",
        highlight
          ? "border-primary-muted bg-primary-soft"
          : "border-border bg-surface",
        SPAN_CLASS[span],
      )}
    >
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-[12px]",
          highlight ? "bg-surface" : "bg-primary-soft",
        )}
      >
        <Icon className="text-primary size-[23px]" aria-hidden />
      </span>
      <h3 className="font-display text-foreground text-xl font-medium">
        {title}
      </h3>
      <p className="text-muted-foreground max-w-[56ch] text-sm">{text}</p>

      {id === "payments" ? (
        <ul className="mt-auto flex flex-wrap gap-2 pt-2">
          {PAYMENT_METHODS.map(({ id: methodId, label, icon: MethodIcon }) => (
            <li
              key={methodId}
              className="bg-surface text-foreground flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
            >
              <MethodIcon className="text-primary size-3.5" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
      ) : (
        tags && (
          <ul className="mt-auto flex flex-wrap gap-2 pt-2">
            {tags.map((tag) => (
              <li
                key={tag}
                className="bg-muted text-muted-foreground rounded-full px-3 py-1.5 text-xs font-medium"
              >
                {tag}
              </li>
            ))}
          </ul>
        )
      )}
    </li>
  );
}

export function Features() {
  return (
    <Section id="features" innerClassName="flex flex-col gap-10">
      <SectionHeading
        align="left"
        title="ครบทุกจังหวะของร้านคุณ ตั้งแต่สั่งจนปิดบิล"
        description="ใช้งานง่ายทั้งเจ้าของร้าน พนักงานหน้าร้าน และทีมครัว"
      />
      <ul className="grid gap-5 lg:grid-cols-6">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.id} feature={feature} />
        ))}
      </ul>
    </Section>
  );
}
