"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Phone, ChevronRight, ArrowLeft, Users, Loader2 } from "lucide-react";
import { getCoachRosterAction, type CoachPlayerItem } from "@/app/actions/players";

export default function CoachRosterPage() {
  const [roster, setRoster] = useState<CoachPlayerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getCoachRosterAction();
      if (!res.success) {
        setError(res.error || "Nie udało się załadować kadry.");
      } else {
        setRoster(res.roster || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl py-20 text-center">
        <Loader2 className="mx-auto size-8 animate-spin text-primary" />
        <p className="mt-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Wczytywanie kadry zawodniczej...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border-2 border-destructive bg-destructive/10 p-6 text-center">
        <p className="font-heading text-lg uppercase text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      <div>
        <Link
          href="/trener"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider mb-2 transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Do jednostek treningowych
        </Link>
        <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
          Panel szkoleniowy
        </p>
        <h1 className="font-heading text-4xl uppercase tracking-tight">
          Kadra Zawodnicza ({roster.length})
        </h1>
        <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
          Wybierz zawodnika, aby prześledzić jego historię ocen, absencje oraz samoocenę z ankiet.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {roster.map((player) => (
          <div
            key={player.id}
            className="group flex flex-col justify-between rounded-2xl border-2 border-foreground/20 bg-card p-4 transition-all hover:border-foreground/50 hover:shadow-[3px_3px_0_0_var(--foreground)]"
          >
            <Link
              href={`/trener/zawodnicy/${player.id}`}
              className="flex items-start gap-3.5 focus:outline-none"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-foreground/20 bg-muted">
                {player.avatarUrl ? (
                  <Image
                    src={player.avatarUrl}
                    alt={`${player.firstName} ${player.lastName}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-heading text-lg font-bold text-muted-foreground">
                    {player.firstName[0]}{player.lastName[0]}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-primary">
                    #{player.jerseyNumber ?? "—"}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-foreground transition-all" />
                </div>
                <h2 className="truncate font-heading text-lg uppercase tracking-tight group-hover:text-primary transition-colors">
                  {player.firstName} {player.lastName}
                </h2>
                <p className="truncate font-mono text-[11px] font-semibold text-muted-foreground">
                  {player.teamName} {player.ageGroup ? `(${player.ageGroup})` : ""}
                </p>
              </div>
            </Link>

            {player.parentPhone ? (
              <div className="mt-3.5 flex items-center justify-between border-t border-border/70 pt-2.5">
                <span className="font-mono text-[10px] uppercase text-muted-foreground truncate">
                  {player.parentName ? `Opiekun: ${player.parentName}` : "Kontakt SOS"}
                </span>
                <a
                  href={`tel:${player.parentPhone}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-foreground/20 bg-background px-2 py-1 font-mono text-[10px] font-bold hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Phone className="size-3" />
                  <span>{player.parentPhone}</span>
                </a>
              </div>
            ) : (
              <div className="mt-3.5 border-t border-border/70 pt-2.5">
                <span className="font-mono text-[10px] text-muted-foreground/60 italic">
                  Brak telefonu opiekuna
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {roster.length === 0 && (
        <div className="rounded-2xl border-2 border-foreground/20 p-8 text-center text-muted-foreground">
          <Users className="mx-auto size-8 text-muted-foreground/60 mb-2" />
          <p className="font-heading text-lg uppercase text-foreground">Brak zawodników w kadrze</p>
          <p className="text-xs mt-1">Żaden aktywny gracz nie jest przypisany do prowadzonych przez Ciebie zespołów.</p>
        </div>
      )}
    </div>
  );
}