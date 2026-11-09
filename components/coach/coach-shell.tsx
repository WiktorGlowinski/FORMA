"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Users, Dumbbell, ChartNoAxesCombined } from "lucide-react";
import { PitchArt, PitchMark } from "@/components/landing/mark";
import { signOutAction } from "@/app/actions/auth";
import { useCoachStore } from "@/store/useCoachStore";
import { cn } from "@/lib/utils";
import { AssistantWidget } from "@/components/assistant/assistant-widget";
import { BugReportWidget } from "@/components/bug-reports/bug-report-widget";

function CoachNav() {
  const pathname = usePathname();
  const isUnitsActive =
    pathname === "/trener" ||
    (pathname.startsWith("/trener/") &&
      !pathname.startsWith("/trener/zawodnicy") &&
      !pathname.startsWith("/trener/analiza"));
  const isSquadActive = pathname.startsWith("/trener/zawodnicy");
  const isAnalyticsActive = pathname.startsWith("/trener/analiza");

  return (
    <nav className="flex items-center gap-2 sm:gap-4 text-sm" aria-label="Panel trenera">
      <Link
        href="/trener"
        className={cn(
          "flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 font-heading text-xs uppercase tracking-wider transition-all active:scale-95",
          isUnitsActive
            ? "border-foreground bg-primary text-primary-foreground font-bold shadow-[2px_2px_0_0_var(--foreground)]"
            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <Dumbbell className="size-3.5" />
        <span>Jednostki</span>
      </Link>

      <Link
        href="/trener/zawodnicy"
        className={cn(
          "flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 font-heading text-xs uppercase tracking-wider transition-all active:scale-95",
          isSquadActive
            ? "border-foreground bg-primary text-primary-foreground font-bold shadow-[2px_2px_0_0_var(--foreground)]"
            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <Users className="size-3.5" />
        <span>Kadra</span>
      </Link>

      <Link
        href="/trener/analiza"
        className={cn(
          "flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 font-heading text-xs uppercase tracking-wider transition-all active:scale-95",
          isAnalyticsActive
            ? "border-foreground bg-primary text-primary-foreground font-bold shadow-[2px_2px_0_0_var(--foreground)]"
            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <ChartNoAxesCombined className="size-3.5" />
        <span>Analiza</span>
      </Link>
    </nav>
  );
}

function CoachNavFallback() {
  return (
    <nav className="flex items-center gap-2 sm:gap-4 text-sm opacity-60" aria-label="Panel trenera">
      <span className="flex items-center gap-1.5 rounded-xl border-2 border-foreground bg-primary text-primary-foreground font-bold px-3 py-1.5 font-heading text-xs uppercase tracking-wider">
        <Dumbbell className="size-3.5" />
        <span>Jednostki</span>
      </span>
      <span className="flex items-center gap-1.5 rounded-xl border-2 border-transparent text-muted-foreground px-3 py-1.5 font-heading text-xs uppercase tracking-wider">
        <Users className="size-3.5" />
        <span>Kadra</span>
      </span>
      <span className="flex items-center gap-1.5 rounded-xl border-2 border-transparent text-muted-foreground px-3 py-1.5 font-heading text-xs uppercase tracking-wider">
        <ChartNoAxesCombined className="size-3.5" />
        <span>Analiza</span>
      </span>
    </nav>
  );
}

export function CoachShell({ children, userId }: { children: React.ReactNode; userId: string }) {
  const invalidateCache = useCoachStore((state) => state.invalidateCache);
  const router = useRouter();

  async function handleSignOut() {
    invalidateCache();
    await signOutAction();
    router.push("/login");
  }

  return (
    <div className="relative flex min-h-screen flex-1 flex-col overflow-x-hidden bg-background">
      {/* LINIE BOISKA FORMY W TLE */}
      <PitchArt className="pointer-events-none fixed top-16 -right-[15%] w-[680px] text-foreground/10 select-none opacity-60 block" />
      <PitchArt className="pointer-events-none fixed bottom-0 -left-[20%] w-[600px] text-foreground/10 select-none opacity-40 hidden md:block rotate-180" />

      {/* GÓRNY PASEK NAWIGACYJNY */}
      <header className="fixed inset-x-0 top-0 z-50 border-b-2 border-foreground/15 bg-background/95 backdrop-blur-md shadow-[0_2px_0_0_rgba(0,0,0,0.02)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/trener" className="group flex items-center gap-2.5 text-foreground">
            <PitchMark className="size-7 text-primary transition-transform duration-200 group-hover:rotate-12" />
            <span className="font-heading text-[1.85rem] leading-none tracking-wide uppercase">Forma</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <Suspense fallback={<CoachNavFallback />}>
              <CoachNav />
            </Suspense>

            <div className="h-5 w-px bg-border/80 mx-1 hidden sm:block" />

            <Link href="/" className="pitch-link text-xs text-muted-foreground hidden sm:block">
              Start
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-foreground/20 px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition hover:border-destructive/60 hover:text-destructive hover:shadow-[2px_2px_0_0_var(--foreground)] active:scale-95"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Wyloguj</span>
            </button>
          </div>
        </div>
      </header>

      {/* GŁÓWNA TREŚĆ */}
      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 pb-6 pt-20 sm:px-6 sm:pb-8 sm:pt-24">
        {children}
      </main>
      <AssistantWidget key={userId} userId={userId} />
      <BugReportWidget />
    </div>
  );
}