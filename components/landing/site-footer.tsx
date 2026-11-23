import Link from "next/link";
import { FOOTER_LINKS, NAV } from "@/components/landing/copy";
import { PitchArt, PitchMark } from "@/components/landing/mark";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t-2 border-foreground/15">
      <PitchArt className="pointer-events-none absolute -bottom-16 -left-10 w-[420px] text-foreground/10" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <PitchMark className="size-6 text-primary" />
            <span className="font-heading text-3xl leading-none">Forma</span>
          </div>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Narzędzie dla klubu piłkarskiego. Trener zapisuje formę zawodnika względem niego samego.
            Podgląd oceny na stronie głównej nie zapisuje się na serwerze.
          </p>
        </div>
        <nav className="flex max-w-md flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground" aria-label="Stopka">
          {NAV.map((item) => (
            <Link key={item.href} href={`/${item.href}`} className="pitch-link">
              {item.label}
            </Link>
          ))}
          {FOOTER_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="pitch-link">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}