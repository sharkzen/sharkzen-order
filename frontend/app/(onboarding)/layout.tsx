import { Logo } from "@/components/layout/logo";

export default function OnboardingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="border-border bg-surface border-b">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center px-5 md:h-[72px] md:px-10 xl:px-20">
          <Logo />
        </div>
      </header>
      <main className="bg-background relative isolate flex flex-1 flex-col">
        <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
        <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center px-5 py-8 md:px-10 md:py-12 xl:px-20">
          {children}
        </div>
      </main>
    </div>
  );
}
