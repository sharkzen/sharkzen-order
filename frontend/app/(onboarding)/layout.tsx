import { Logo } from "@/components/layout/logo";

export default function OnboardingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-border bg-surface border-b">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center px-5 md:px-10 xl:px-20">
          <Logo />
        </div>
      </header>
      <main className="bg-background relative isolate flex flex-1 justify-center px-5 py-10 md:py-16">
        <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
        <div className="border-border bg-surface shadow-float h-fit w-full max-w-[680px] rounded-xl border p-6 sm:p-9">
          {children}
        </div>
      </main>
    </div>
  );
}
