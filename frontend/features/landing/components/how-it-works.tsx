import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { STEPS } from "../data";

export function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      tone="soft"
      className="py-[72px]"
      innerClassName="flex flex-col gap-12"
    >
      <SectionHeading title="จากสแกนบนโต๊ะ ถึงปิดบิล ใน 4 ขั้นตอน" />

      <Stagger className="grid gap-8 md:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, text }, index) => (
          <StaggerItem
            key={title}
            className="md:before:border-primary/40 relative flex flex-col items-center gap-4 text-center md:before:absolute md:before:top-6 md:before:left-[calc(50%+40px)] md:before:w-[calc(100%-80px+2rem)] md:before:border-t md:before:border-dashed md:last:before:hidden"
          >
            <span className="font-display bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-xl text-xl font-semibold">
              {index + 1}
            </span>
            <div className="bg-surface flex w-full flex-1 flex-col items-center gap-3 rounded-xl p-7">
              <Icon className="text-primary size-9" aria-hidden />
              <h3 className="font-display text-foreground text-xl font-medium">
                {title}
              </h3>
              <p className="text-muted-foreground text-base">{text}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
