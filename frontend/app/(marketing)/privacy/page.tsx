import type { Metadata } from "next";
import { LegalPage } from "@/features/legal/components/legal-page";
import { PRIVACY } from "@/features/legal/data/privacy";

export const metadata: Metadata = {
  title: PRIVACY.title,
  description: PRIVACY.description,
};

export default function PrivacyPage() {
  return <LegalPage doc={PRIVACY} />;
}
