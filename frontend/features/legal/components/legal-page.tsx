import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { LEGAL_UPDATED, type LegalDocument } from "../types";

/** หน้าเอกสารทางกฎหมาย: สารบัญติดข้างซ้าย (จอใหญ่) เนื้อหาอ่านสบายความกว้างจำกัด */
export function LegalPage({ doc }: { doc: LegalDocument }) {
  return (
    <div className="bg-surface px-5 py-12 md:px-12 lg:px-24 lg:py-16">
      <div className="mx-auto max-w-[1100px]">
        <Link
          href={ROUTES.register}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-primary/50 mb-8 inline-flex items-center gap-1.5 rounded text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <ArrowLeft className="size-4" aria-hidden />
          กลับไปสมัครสมาชิก
        </Link>

        <header className="border-border mb-10 flex flex-col gap-3 border-b pb-8">
          <h1 className="font-display text-foreground text-[34px] leading-tight font-semibold md:text-[42px]">
            {doc.title}
          </h1>
          <p className="text-muted-foreground max-w-[640px] text-base">
            {doc.description}
          </p>
          <p className="text-muted-foreground text-sm">
            ปรับปรุงล่าสุด {LEGAL_UPDATED}
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-16">
          <nav aria-label="สารบัญ" className="hidden lg:block">
            <ol className="sticky top-24 flex flex-col gap-2.5 text-sm">
              {doc.sections.map((section, index) => (
                <li key={section.title}>
                  <a
                    href={`#section-${index + 1}`}
                    className="text-muted-foreground hover:text-primary-strong flex gap-2 transition-colors"
                  >
                    <span className="w-5 shrink-0 tabular-nums">
                      {index + 1}.
                    </span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="flex max-w-[720px] flex-col gap-9">
            {doc.sections.map((section, index) => (
              <section
                key={section.title}
                id={`section-${index + 1}`}
                className="scroll-mt-24"
              >
                <h2 className="font-display text-foreground mb-3 text-xl font-semibold">
                  {index + 1}. {section.title}
                </h2>
                <div className="text-foreground/85 flex flex-col gap-3 text-[15px] leading-[1.85]">
                  {section.paragraphs?.map((text) => (
                    <p key={text}>{text}</p>
                  ))}
                  {section.items && (
                    <ul className="marker:text-primary flex list-disc flex-col gap-1.5 pl-5">
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </article>
        </div>
      </div>
    </div>
  );
}
