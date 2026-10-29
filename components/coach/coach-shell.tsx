"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { PitchArt, PitchMark } from "@/components/landing/mark";
import { signOutAction } from "@/app/actions/auth";

export function CoachShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-1 flex-col overflow-x-hidden bg-background">
      
      {/* CHARAKTERYSTYCZNE LINIE BOISKA FORMY W TLE */}
      <PitchArt className="pointer-events-none fixed top-16 -right-[15%] w-[680px] text-foreground/10 select-none opacity-60 block" />
      <PitchArt className="pointer-events-none fixed bottom-0 -left-[20%] w-[600px] text-foreground/10 select-none opacity-40 hidden md:block rotate-180" />

      {/* GÓRNY PASEK NAWIGACYJNY (NAGŁÓWEK Z LOGO I WYLOGOWANIEM) */}
      <header className="sticky top-0 z-40 border-b-2 border-foreground/15 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/trener" className="group flex items-center gap-2.5 text-foreground">
            <PitchMark className="size-7 text-primary transition-transform duration-200 group-hover:rotate-12" />
            <span className="font-heading text-[1.85rem] leading-none tracking-wide uppercase">Forma</span>
          </Link>

          <nav className="flex items-center gap-4 sm:gap-6 text-sm text-muted-foreground" aria-label="Panel trenera">
            <Link href="/trener" className="pitch-link font-bold text-foreground">
              Jednostki
            </Link>
            <Link href="/" className="pitch-link text-xs sm:text-sm">
              Strona startowa
            </Link>
            
            {/* Przycisk bezpiecznego wylogowania ze sztabu */}
            <button
              type="button"
              onClick={() => signOutAction()}
              className="inline-flex items-center gap-1.5 rounded-md border-2 border-foreground/15 px-3 py-1.5 text-xs font-semibold tracking-wider uppercase transition hover:-translate-y-0.5 hover:border-destructive/60 hover:text-destructive hover:shadow-[2px_2px_0_0_var(--foreground)] active:scale-95"
            >
              <LogOut className="size-3.5" />
              <span>Wyloguj</span>
            </button>
          </nav>
        </div>
      </header>

      {/* GŁÓWNA TREŚĆ */}
      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}