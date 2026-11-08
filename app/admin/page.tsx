export const instant = false;

import { connection } from "next/server";
import Link from "next/link";
import { 
  Users, 
  Layers, 
  Award, 
  Calendar, 
  ArrowRight, 
  UserCheck, 
  UserPlus,
  Plus,
  MapPin,
} from "lucide-react";
import { getAdminDashboardAction } from "@/app/actions/admin";

export default async function AdminDashboardPage() {
  await connection();
  const res = await getAdminDashboardAction();

  const metrics = res.metrics || {
    totalTeams: 0,
    activeTeams: 0,
    totalPlayers: 0,
    activePlayers: 0,
    totalCoaches: 0,
  };

  const clubName = res.club?.name || "KS FORMA Bydgoszcz";
  const seasonName = res.currentSeason || "2026/2027";

  return (
    <div className="space-y-8 pb-16">
      {/* NAGŁÓWEK PULPITU */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b-2 border-foreground/15 pb-6">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
            Centrum Zarządzania Klubem
          </p>
          <h1 className="mt-1 font-heading text-4xl uppercase tracking-tight sm:text-5xl">
            {clubName}
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            Bieżący cykl rozgrywkowy: <span className="font-bold text-foreground">{seasonName}</span>
          </p>
        </div>

        {/* PRZYCISKI SZYBKICH AKCJI */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/sztab"
            className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-foreground/20 bg-background px-4 text-xs font-heading uppercase tracking-wider font-bold transition hover:bg-muted active:scale-95 shadow-[2px_2px_0_0_var(--foreground)]"
          >
            <UserCheck className="size-4 text-primary" />
            <span>Sztab</span>
          </Link>

          <Link
            href="/admin/zawodnicy"
            className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-foreground/20 bg-background px-4 text-xs font-heading uppercase tracking-wider font-bold transition hover:bg-muted active:scale-95 shadow-[2px_2px_0_0_var(--foreground)]"
          >
            <UserPlus className="size-4 text-primary" />
            <span>Kartoteka</span>
          </Link>

          <Link
            href="/admin/boiska"
            className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-foreground/20 bg-background px-4 text-xs font-heading uppercase tracking-wider font-bold transition hover:bg-muted active:scale-95 shadow-[2px_2px_0_0_var(--foreground)]"
          >
            <MapPin className="size-4 text-primary" />
            <span>Boiska</span>
          </Link>

          <Link
            href="/admin/druzyny"
            className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-foreground bg-primary px-4 text-xs font-heading uppercase tracking-wider font-black text-primary-foreground transition active:scale-95 shadow-[3px_3px_0_0_var(--foreground)] shrink-0"
          >
            <Plus className="size-4 stroke-[3]" />
            <span>Struktura Drużyn</span>
          </Link>
        </div>
      </div>

      {/* PASEK METRYK KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Zawodnicy */}
        <div className="rounded-2xl border-2 border-foreground/20 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Zawodnicy</span>
            <Users className="size-4 text-primary" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-heading text-4xl font-semibold tracking-tight">{metrics.activePlayers}</span>
            <span className="font-mono text-xs text-muted-foreground">/ {metrics.totalPlayers}</span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">W kadrach aktywnych</p>
        </div>

        {/* Roczniki */}
        <div className="rounded-2xl border-2 border-foreground/20 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Roczniki</span>
            <Layers className="size-4 text-primary" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-heading text-4xl font-semibold tracking-tight">{metrics.totalTeams}</span>
            <span className="font-mono text-xs text-muted-foreground">zespołów</span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">Zgłoszonych w bazie</p>
        </div>

        {/* Sztab */}
        <div className="rounded-2xl border-2 border-foreground/20 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Sztab</span>
            <Award className="size-4 text-primary" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-heading text-4xl font-semibold tracking-tight">{metrics.totalCoaches}</span>
            <span className="font-mono text-xs text-muted-foreground">osób w sztabie</span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">Konta z licencją</p>
        </div>

        {/* Sezon */}
        <div className="rounded-2xl border-2 border-foreground/20 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Sezon</span>
            <Calendar className="size-4 text-primary" />
          </div>
          <div className="mt-3">
            <span className="font-heading text-3xl font-semibold tracking-tight truncate block">{seasonName}</span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-primary font-bold uppercase">Status: Otwarty</p>
        </div>
      </div>

      {/* GŁÓWNE MODUŁY ZARZĄDZANIA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Drużyny & Roczniki */}
        <Link
          href="/admin/druzyny"
          className="group rounded-2xl border-2 border-foreground/20 bg-card p-6 shadow-sm hover:border-foreground hover:shadow-[4px_4px_0_0_var(--foreground)] transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
                Moduł Sportowy
              </span>
              <Layers className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h2 className="mt-2 font-heading text-2xl uppercase tracking-tight">
              Drużyny & Roczniki
            </h2>
            <p className="mt-1.5 font-mono text-xs text-muted-foreground leading-relaxed">
              Konfiguruj roczniki klubowe, przypisuj trenerów do kadr oraz wyznaczaj I Trenerów odpowiedzialnych za realizację mikrocyklu.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 font-mono text-xs font-bold text-foreground group-hover:text-primary transition-colors">
            <span>Otwórz zespoły</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* 2. Sztab */}
        <Link
          href="/admin/sztab"
          className="group rounded-2xl border-2 border-foreground/20 bg-card p-6 shadow-sm hover:border-foreground hover:shadow-[4px_4px_0_0_var(--foreground)] transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
                Zarządzanie Kadrą
              </span>
              <Award className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h2 className="mt-2 font-heading text-2xl uppercase tracking-tight">
              Sztab
            </h2>
            <p className="mt-1.5 font-mono text-xs text-muted-foreground leading-relaxed">
              Rejestracja nowych szkoleniowców, edycja danych kontaktowych, reset haseł, awatary oraz podgląd przypisań do zespołów.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 font-mono text-xs font-bold text-foreground group-hover:text-primary transition-colors">
            <span>Zarządzaj sztabem</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* 3. Baza Zawodników */}
        <Link
          href="/admin/zawodnicy"
          className="group rounded-2xl border-2 border-foreground/20 bg-card p-6 shadow-sm hover:border-foreground hover:shadow-[4px_4px_0_0_var(--foreground)] transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
                Kartoteka
              </span>
              <Users className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h2 className="mt-2 font-heading text-2xl uppercase tracking-tight">
              Baza Zawodników
            </h2>
            <p className="mt-1.5 font-mono text-xs text-muted-foreground leading-relaxed">
              Masowy import z CSV, numery na koszulkach, roczniki oraz kompletne dane kontaktowe graczy i rodziców do ankiet.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 font-mono text-xs font-bold text-foreground group-hover:text-primary transition-colors">
            <span>Przejdź do bazy</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* 4. Sezony & Herb */}
        <Link
          href="/admin/sezony"
          className="group rounded-2xl border-2 border-foreground/20 bg-card p-6 shadow-sm hover:border-foreground hover:shadow-[4px_4px_0_0_var(--foreground)] transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
                Organizacja
              </span>
              <Calendar className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h2 className="mt-2 font-heading text-2xl uppercase tracking-tight">
              Sezony & Herb
            </h2>
            <p className="mt-1.5 font-mono text-xs text-muted-foreground leading-relaxed">
              Otwieranie nowych cykli rozgrywkowych, archiwizacja starych ocen oraz oficjalny herb klubu widoczny w systemie.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 font-mono text-xs font-bold text-foreground group-hover:text-primary transition-colors">
            <span>Zarządzaj cyklem</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* 5. Boiska i obiekty */}
        <Link
          href="/admin/boiska"
          className="group rounded-2xl border-2 border-foreground/20 bg-card p-6 shadow-sm hover:border-foreground hover:shadow-[4px_4px_0_0_var(--foreground)] transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
                Infrastruktura klubu
              </span>
              <MapPin className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h2 className="mt-2 font-heading text-2xl uppercase tracking-tight">
              Boiska i obiekty
            </h2>
            <p className="mt-1.5 font-mono text-xs text-muted-foreground leading-relaxed">
              Dodawaj obiekty treningowe dostępne do wyboru przez trenerów przy planowaniu zajęć.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 font-mono text-xs font-bold text-foreground group-hover:text-primary transition-colors">
            <span>Zarządzaj boiskami</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>
    </div>
  );
}