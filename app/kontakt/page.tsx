import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/components/landing/copy";
import { PublicShell } from "@/components/landing/public-shell";

export const metadata: Metadata = {
  title: "Kontakt — Forma",
  description: "Kontakt w sprawie serwisu Forma.",
};

export default function ContactPage() {
  return (
    <PublicShell eyebrow="Kontakt" title="Napisz do nas">
      <p className="text-base leading-7">
        W sprawie dostępu dla klubu, działania serwisu albo danych osobowych napisz na adres:
      </p>
      <p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="font-heading text-3xl tracking-tight text-foreground underline underline-offset-4"
        >
          {CONTACT_EMAIL}
        </a>
      </p>
      <p>Na tej stronie nie ma formularza. Wiadomość wysyłasz ze swojej poczty.</p>
    </PublicShell>
  );
}