import { siteConfig } from "@/config/site";
import { Container } from "./container";

// "use cache" ทำให้ new Date() ถูก prerender ได้ภายใต้ cacheComponents
export async function Footer() {
  "use cache";

  return (
    <footer className="border-border text-muted-foreground border-t py-6 text-sm">
      <Container>
        © {new Date().getFullYear()} {siteConfig.name}
      </Container>
    </footer>
  );
}
