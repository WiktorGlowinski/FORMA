"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Phone, ChevronRight, ArrowLeft, Users, Loader2, AlertCircle } from "lucide-react";
import { getCoachRosterAction, type CoachPlayerItem } from "@/app/actions/players";
import { getCoachAlertsAction, type CoachAlertItem } from "@/app/actions/coach";
import { cn } from "@/lib/utils";

export default function CoachRosterPage() {
  const [roster, setRoster] = useState<CoachPlayerItem[]>([]);
  const [alerts, setAlerts] = useState<CoachAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [res, alertsRes] = await Promise.all([
        getCoachRosterAction(),
        getCoachAlertsAction(),
      ]);
      if (!res.success) {
        setError(res.error || "Nie udało się załadować kadry.");
      } else {
        setRoster(res.roster || []);
      }
      if (!alertsRes.success) {
        setError(alertsRes.error || "Nie udało się pobrać zawodników wymagających uwagi.");
      } else {
        setAlerts(alertsRes.alerts || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  const alertsByPlayerId = new Map(alerts.map((alert) => [alert.playerId, alert]));
  const rosterByTeam = roster.reduce<Map<string, CoachPlayerItem[]>>((groups, player) => {
    const teamPlayers = groups.get(player.teamName) || [];
    teamPlayers.push(player);
    groups.set(player.teamName, teamPlayers);
    return groups;
  }, new Map());

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

      {alerts.length > 0 && (
        <div className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2.5">
            <AlertCircle className="size-4 text-amber-600" />
            <h2 className="font-heading text-xs font-bold uppercase tracking-wider">
              Zawodnicy wymagający uwagi ({alerts.length})
            </h2>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {alerts.map((alert) => (
              <Link
                key={`${alert.playerId}-${alert.type}`}
                href={`/trener/zawodnicy/${alert.playerId}`}
                className={cn(
                  "rounded-xl border px-3 py-2 transition-colors hover:border-foreground/50",
                  alert.severity === "danger"
                    ? "border-rose-500/30 bg-rose-500/10"
                    : "border-amber-500/30 bg-amber-500/10"
                )}
              >
                <span className="block text-xs font-bold">
                  {alert.jerseyNumber ? `#${alert.jerseyNumber} ` : ""}
                  {alert.playerName}
                </span>
                <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                  {alert.badgeText}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-8">
        {Array.from(rosterByTeam.entries()).map(([teamName, teamPlayers]) => (
          <section key={teamName} aria-labelledby={`team-${teamName}`}>
            <div className="mb-3 flex items-baseline gap-2 border-b-2 border-foreground/15 pb-2">
              <h2 id={`team-${teamName}`} className="font-heading text-2xl uppercase tracking-tight">
                {teamName}
              </h2>
              <span className="font-mono text-[11px] font-bold text-muted-foreground">
                {teamPlayers.length} {teamPlayers.length === 1 ? "zawodnik" : "zawodników"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {teamPlayers.map((player) => (
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
                      <h3 className="truncate font-heading text-lg uppercase tracking-tight group-hover:text-primary transition-colors">
                        {player.firstName} {player.lastName}
                      </h3>
                      <p className="truncate font-mono text-[11px] font-semibold text-muted-foreground">
                        {player.ageGroup ? `(${player.ageGroup})` : ""}
                      </p>
                    </div>
                  </Link>

                  {alertsByPlayerId.get(player.id) && (
                    <div className="mt-3 flex items-start gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-[10px] text-amber-950 dark:text-amber-100">
                      <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                      <span>
                        {alertsByPlayerId.get(player.id)?.badgeText}
                        {" — "}
                        {alertsByPlayerId.get(player.id)?.description}
                      </span>
                    </div>
                  )}

                  {player.parentPhone ? (
                    <div className="mt-3.5 flex items-center justify-between border-t border-border/70 pt-2.5">
                      <span className="truncate font-mono text-[10px] uppercase text-muted-foreground">
                        {player.parentName ? `Opiekun: ${player.parentName}` : "Kontakt SOS"}
                      </span>
                      <a
                        href={`tel:${player.parentPhone}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-foreground/20 bg-background px-2 py-1 font-mono text-[10px] font-bold transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        <Phone className="size-3" />
                        <span>{player.parentPhone}</span>
                      </a>
                    </div>
                  ) : (
                    <div className="mt-3.5 border-t border-border/70 pt-2.5">
                      <span className="font-mono text-[10px] italic text-muted-foreground/60">
                        Brak telefonu opiekuna
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
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