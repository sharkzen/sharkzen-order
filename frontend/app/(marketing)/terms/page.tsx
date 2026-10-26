import type { Metadata } from "next";
import { LegalPage } from "@/features/legal/components/legal-page";
import { TERMS } from "@/features/legal/data/terms";

export const metadata: Metadata = {
  title: TERMS.title,
  description: TERMS.description,
};

export default function TermsPage() {
  return <LegalPage doc={TERMS} />;
}
