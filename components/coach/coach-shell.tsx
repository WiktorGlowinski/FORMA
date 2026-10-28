import Link from "next/link";
import { PitchArt, PitchMark } from "@/components/landing/mark";

export function CoachShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-x-hidden">
      <PitchArt className="pointer-events-none absolute top-24 -right-[18%] hidden w-[640px] text-foreground/10 lg:block" />
      <header className="sticky top-0 z-40 border-b-2 border-foreground/15 bg-background/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/trener" className="group flex items-center gap-2.5 text-foreground">
            <PitchMark className="size-7 text-primary transition-transform duration-200 group-hover:rotate-12" />
            <span className="font-heading text-[1.85rem] leading-none tracking-wide uppercase">Forma</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground" aria-label="Panel trenera">
            <Link href="/trener" className="pitch-link">
              Jednostki
            </Link>
            <Link href="/" className="pitch-link">
              Strona startowa
            </Link>
          </nav>
        </div>
      </header>
      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}