"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PitchMark } from "@/components/landing/mark";
import { signOutAction } from "@/app/actions/auth";
import { 
  Menu, 
  X, 
  LogOut, 
  LayoutDashboard, 
  Layers, 
  Award, 
  Users, 
  Calendar,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminNavbarProps {
  clubName: string;
}

const NAV_LINKS = [
  { href: "/admin", label: "Przegląd", icon: LayoutDashboard },
  { href: "/admin/druzyny", label: "Drużyny", icon: Layers },
  { href: "/admin/sztab", label: "Sztab", icon: Award },
  { href: "/admin/zawodnicy", label: "Gracze", icon: Users },
  { href: "/admin/sezony", label: "Sezony", icon: Calendar },
  { href: "/admin/boiska", label: "Boiska", icon: MapPin },
];

export function AdminNavbar({ clubName }: AdminNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-foreground/15 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* LOGO I NAZWA KLUBU */}
        <div className="flex items-center gap-3">
          <Link 
            href="/admin" 
            onClick={() => setIsOpen(false)}
            className="group flex items-center gap-2.5 text-foreground"
          >
            <PitchMark className="size-7 text-primary transition-transform duration-200 group-hover:rotate-12" />
            <span className="font-heading text-[1.85rem] leading-none tracking-wide uppercase">
              Forma
            </span>
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
            {clubName}
          </span>
        </div>

        {/* NAWIGACJA DESKTOP (od ekranów md w górę) */}
        <nav 
          className="hidden md:flex items-center gap-3 lg:gap-6 text-xs font-heading uppercase tracking-wider" 
          aria-label="Nawigacja administratora"
        >
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-2 py-1 transition-colors rounded-md",
                  isActive
                    ? "font-bold text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}

          <span className="h-4 w-px bg-foreground/20" />

          {/* Wylogowanie Desktop */}
          <form action={signOutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md border-2 border-foreground/15 px-3 py-1.5 text-xs font-semibold tracking-wider uppercase transition hover:-translate-y-0.5 hover:border-destructive/60 hover:text-destructive hover:shadow-[2px_2px_0_0_var(--foreground)] active:scale-95"
            >
              <LogOut className="size-3.5" />
              <span className="hidden lg:inline">Wyloguj</span>
            </button>
          </form>
        </nav>

        {/* PRZYCISK HAMBURGERA NA TELEFON */}
        <div className="flex items-center md:hidden">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="Przełącz menu"
            aria-expanded={isOpen}
            className="inline-flex size-10 items-center justify-center rounded-xl border-2 border-foreground/20 bg-card text-foreground transition active:scale-95 shadow-[2px_2px_0_0_var(--foreground)]"
          >
            {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* ROZWIJANY PANEL MOBILNY */}
      {isOpen && (
        <div className="md:hidden border-t-2 border-foreground/15 bg-card/98 px-4 py-4 space-y-3 backdrop-blur-xl animate-in slide-in-from-top-2 duration-150 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-border/80">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
              Menu Zarządzania
            </span>
            <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground font-semibold">
              {clubName}
            </span>
          </div>

          <div className="space-y-1">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-heading text-sm uppercase tracking-wide transition active:scale-[0.99]",
                    isActive
                      ? "bg-primary text-primary-foreground font-bold shadow-[2px_2px_0_0_var(--foreground)]"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="border-t border-border/80 pt-2">
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-destructive/30 bg-destructive/10 px-4 py-2.5 font-heading text-xs uppercase tracking-wider font-bold text-destructive hover:bg-destructive/20 transition active:scale-95"
              >
                <LogOut className="size-4" />
                <span>Wyloguj z systemu</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}