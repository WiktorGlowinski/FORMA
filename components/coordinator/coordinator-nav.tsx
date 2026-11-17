"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LogOut, Menu, ShieldCheck, Users, X } from "lucide-react";
import { useState } from "react";
import { signOutAction } from "@/app/actions/auth";
import { PitchMark } from "@/components/landing/mark";
import { cn } from "@/lib/utils";

type CoordinatorNavProps = {
  canManageClub: boolean;
};

function NavigationLinks({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isOverview = pathname === "/koordynator";

  return (
    <nav
      aria-label="Panel koordynatora"
      className={cn(
        "text-sm",
        mobile ? "flex flex-col gap-2" : "hidden items-center gap-2 sm:flex",
      )}
    >
      <Link
        href="/koordynator"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 font-heading text-xs uppercase tracking-wider transition-all active:scale-95",
          isOverview
            ? "border-foreground bg-primary font-bold text-primary-foreground shadow-[2px_2px_0_0_var(--foreground)]"
            : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        )}
      >
        <BarChart3 className="size-3.5" />
        <span>Podgląd klubu</span>
      </Link>
      <Link
        href="/koordynator#analiza"
        onClick={onNavigate}
        className="flex items-center gap-1.5 rounded-xl border-2 border-transparent px-3 py-2 font-heading text-xs uppercase tracking-wider text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground active:scale-95"
      >
        <Users className="size-3.5" />
        <span>Analiza zespołu</span>
      </Link>
      <Link
        href="/koordynator#mikrocykl"
        onClick={onNavigate}
        className="flex items-center gap-1.5 rounded-xl border-2 border-transparent px-3 py-2 font-heading text-xs uppercase tracking-wider text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground active:scale-95"
      >
        <BarChart3 className="size-3.5" />
        <span>Mikrocykl</span>
      </Link>
      <Link
        href="/koordynator#reakcja"
        onClick={onNavigate}
        className="flex items-center gap-1.5 rounded-xl border-2 border-transparent px-3 py-2 font-heading text-xs uppercase tracking-wider text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground active:scale-95"
      >
        <ShieldCheck className="size-3.5" />
        <span>Reakcja</span>
      </Link>
    </nav>
  );
}

export function CoordinatorNav({ canManageClub }: CoordinatorNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="coordinator-scroll-header sticky top-0 z-40 border-b-2 border-foreground/15 bg-background/95 backdrop-blur-md shadow-[0_2px_0_0_rgba(0,0,0,0.02)]">
      <div className="mx-auto flex min-h-16 min-w-0 max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/koordynator" className="group flex items-center gap-2.5 text-foreground">
          <PitchMark className="size-7 text-primary transition-transform duration-200 group-hover:rotate-12" />
          <span className="font-heading text-[1.85rem] leading-none tracking-wide uppercase">Forma</span>
          <span className="border-l border-foreground/20 pl-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Koordynator
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <NavigationLinks />
          {canManageClub && (
            <Link
              href="/admin"
              className="hidden items-center gap-1.5 rounded-xl border-2 border-transparent px-3 py-2 font-heading text-xs uppercase tracking-wider text-muted-foreground transition hover:bg-muted/50 hover:text-foreground sm:flex"
            >
              <ShieldCheck className="size-3.5" />
              Administracja
            </Link>
          )}
          <div className="hidden h-5 w-px bg-border sm:block" />
          <form action={signOutAction} className="hidden sm:block">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-foreground/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition hover:border-destructive/60 hover:text-destructive hover:shadow-[2px_2px_0_0_var(--foreground)] active:scale-95"
            >
              <LogOut className="size-3.5" />
              Wyloguj
            </button>
          </form>

          <div className="relative sm:hidden">
            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              aria-expanded={isOpen}
              aria-controls="coordinator-mobile-menu"
              className="inline-flex size-9 items-center justify-center rounded-xl border-2 border-foreground/20 transition hover:border-foreground active:scale-95"
            >
              <span className="sr-only">{isOpen ? "Zamknij menu" : "Otwórz menu"}</span>
              {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            {isOpen && (
              <div id="coordinator-mobile-menu" className="absolute right-0 top-12 z-30 w-64 rounded-2xl border-2 border-foreground/15 bg-background p-3 shadow-[3px_3px_0_0_var(--foreground)]">
                <NavigationLinks mobile onNavigate={() => setIsOpen(false)} />
                {canManageClub && (
                  <Link href="/admin" onClick={() => setIsOpen(false)} className="mt-2 flex items-center gap-2 rounded-xl border-2 border-transparent px-3 py-2 font-heading text-xs uppercase tracking-wider text-muted-foreground hover:bg-muted/50 hover:text-foreground">
                    <ShieldCheck className="size-3.5" /> Administracja
                  </Link>
                )}
                <form action={signOutAction} className="mt-2 border-t border-foreground/10 pt-2">
                  <button type="submit" className="flex w-full items-center gap-2 rounded-xl border-2 border-foreground/20 px-3 py-2 text-left text-xs font-bold uppercase tracking-wider">
                    <LogOut className="size-3.5" /> Wyloguj
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
