"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Activity,
  Smile,
  Phone,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { formatTrainingDate } from "@/components/coach/data";
import {
  getPlayerAnalyticsAction,
  type PlayerAnalyticsData,
} from "@/app/actions/players";

function AnalyticsLoadingState() {
  return (
    <div className="mx-auto max-w-4xl py-20 text-center">
      <Loader2 className="mx-auto size-8 animate-spin text-primary" />
      <p className="mt-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
        Wczytywanie karty rozwojowej...
      </p>
    </div>
  );
}

function PlayerAnalyticsContent() {
  const params = useParams();
  const playerId = params.id as string;

  const [data, setData] = useState<PlayerAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) return;

    async function load() {
      setLoading(true);
      const res = await getPlayerAnalyticsAction(playerId);
      if (!res.success || !res.data) {
        setError(res.error || "Nie udało się załadować profilu zawodnika.");
      } else {
        setData(res.data);
      }
      setLoading(false);
    }

    load();
  }, [playerId]);

  if (loading) {
    return <AnalyticsLoadingState />;
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border-2 border-destructive bg-destructive/10 p-6 text-center">
        <h2 className="font-heading text-lg uppercase text-destructive">Błąd</h2>
        <p className="mt-1 text-xs text-muted-foreground">{error || "Zawodnik nie istnieje."}</p>
        <Link
          href="/trener/zawodnicy"
          className="mt-4 inline-block font-mono text-xs font-bold underline"
        >
          Wróć do listy kadry
        </Link>
      </div>
    );
  }

  const {
    player,
    history,
    totalTrainings,
    attendedCount,
    attendancePct,
    ratingsBreakdown,
    ratingsPct,
    absencesBreakdown,
    avgFatigue,
    avgSatisfaction,
  } = data;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      <div>
        <Link
          href="/trener/zawodnicy"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Wróć do kadry
        </Link>
        <p className="mt-2 text-xs font-bold tracking-[0.16em] text-primary uppercase">
          Karta rozwojowa PZPN
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border-2 border-foreground/20 bg-card p-5 shadow-[3px_3px_0_0_var(--foreground)]">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-foreground/20 bg-muted">
            {player.avatarUrl ? (
              <Image
                src={player.avatarUrl}
                alt={`${player.firstName} ${player.lastName}`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-heading text-2xl font-black text-muted-foreground">
                {player.firstName[0]}{player.lastName[0]}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-primary">
                #{player.jerseyNumber ?? "—"}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="font-mono text-xs font-bold uppercase text-muted-foreground">
                {player.teamName}
              </span>
            </div>
            <h1 className="font-heading text-3xl uppercase tracking-tight sm:text-4xl">
              {player.firstName} {player.lastName}
            </h1>
            <p className="font-mono text-[11px] text-muted-foreground">
              Kategoria: {player.ageGroup || "Brak kategorii"}
            </p>
          </div>
        </div>

        {player.parentPhone && (
          <div className="flex flex-col sm:items-end border-t sm:border-t-0 sm:border-l border-border/80 pt-3 sm:pt-0 sm:pl-5">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">
              {player.parentName ? `Opiekun: ${player.parentName}` : "Telefon alarmowy"}
            </span>
            <a
              href={`tel:${player.parentPhone}`}
              className="mt-1 inline-flex items-center gap-2 rounded-xl border-2 border-foreground/20 bg-background px-3 py-1.5 font-mono text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all shadow-[2px_2px_0_0_var(--foreground)]"
            >
              <Phone className="size-3.5" />
              <span>{player.parentPhone}</span>
            </a>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border-2 border-foreground/20 bg-card p-4 shadow-sm">
          <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Jednostki</p>
          <p className="mt-1 font-heading text-3xl font-black">{totalTrainings}</p>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">rejestr w bazie</p>
        </div>

        <div className="rounded-2xl border-2 border-foreground/20 bg-card p-4 shadow-sm">
          <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Frekwencja</p>
          <p className="mt-1 font-heading text-3xl font-black">{attendancePct}%</p>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {attendedCount} z {totalTrainings} obecności
          </p>
        </div>

        <div className="rounded-2xl border-2 border-foreground/20 bg-card p-4 shadow-sm">
          <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
            <Activity className="size-3 text-primary" /> Śr. zmęczenie
          </p>
          <p className="mt-1 font-heading text-3xl font-black">{avgFatigue ? `${avgFatigue}/5` : "—"}</p>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">ankiety potreningowe</p>
        </div>

        <div className="rounded-2xl border-2 border-foreground/20 bg-card p-4 shadow-sm">
          <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
            <Smile className="size-3 text-primary" /> Śr. satysfakcja
          </p>
          <p className="mt-1 font-heading text-3xl font-black">{avgSatisfaction ? `${avgSatisfaction}/5` : "—"}</p>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">samoocena zawodnika</p>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-foreground/20 bg-card p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="font-heading text-lg uppercase tracking-tight">
              Rozkład ocen trenera ({ratingsBreakdown.total})
            </h2>
            <p className="text-xs text-muted-foreground">
              Oceny odnoszą się do własnego poziomu gracza. Brak oceny nie jest oceną ujemną.
            </p>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs font-bold">
            <span className="text-emerald-700 dark:text-emerald-400">+ ({ratingsPct.plus}%)</span>
            <span className="text-sky-700 dark:text-sky-400">0 ({ratingsPct.zero}%)</span>
            <span className="text-rose-700 dark:text-rose-400">- ({ratingsPct.minus}%)</span>
          </div>
        </div>

        {ratingsBreakdown.total > 0 ? (
          <div className="flex h-4 w-full overflow-hidden rounded-xl border border-foreground/20 bg-muted">
            <div style={{ width: `${ratingsPct.plus}%` }} className="bg-emerald-500 transition-all" />
            <div style={{ width: `${ratingsPct.zero}%` }} className="bg-sky-400 transition-all" />
            <div style={{ width: `${ratingsPct.minus}%` }} className="bg-rose-500 transition-all" />
          </div>
        ) : (
          <p className="font-mono text-xs text-muted-foreground py-2 italic">
            Brak zarejestrowanych ocen trenerskich dla tego zawodnika.
          </p>
        )}
      </div>

      <div className="rounded-2xl border-2 border-foreground/20 bg-card p-5 shadow-sm space-y-3">
        <h2 className="font-heading text-lg uppercase tracking-tight">
          Powody nieobecności ({absencesBreakdown.injury + absencesBreakdown.illness + absencesBreakdown.excused + absencesBreakdown.unexcused})
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
            <span className="font-mono text-[10px] font-bold uppercase text-rose-800 dark:text-rose-300">Kontuzje</span>
            <p className="mt-1 font-heading text-2xl font-black text-rose-900 dark:text-rose-200">{absencesBreakdown.injury}</p>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <span className="font-mono text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300">Choroby</span>
            <p className="mt-1 font-heading text-2xl font-black text-amber-900 dark:text-amber-200">{absencesBreakdown.illness}</p>
          </div>
          <div className="rounded-xl border border-foreground/15 bg-muted/40 p-3">
            <span className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Usprawiedliwione</span>
            <p className="mt-1 font-heading text-2xl font-black">{absencesBreakdown.excused}</p>
          </div>
          <div className="rounded-xl border border-rose-950/20 bg-rose-950/5 p-3">
            <span className="font-mono text-[10px] font-bold uppercase text-destructive">Nieusprawiedliwione</span>
            <p className="mt-1 font-heading text-2xl font-black text-destructive">{absencesBreakdown.unexcused}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-foreground/20 bg-card overflow-hidden shadow-sm">
        <div className="border-b-2 border-foreground/15 bg-muted/40 px-5 py-3.5">
          <h2 className="font-heading text-lg uppercase tracking-tight">Historia treningów i ankiet</h2>
          <p className="text-xs text-muted-foreground">Zestawienie oceny sztabu ze zmęczeniem i satysfakcją zgłoszoną przez gracza</p>
        </div>

        <div className="divide-y divide-border/80">
          {history.length > 0 ? (
            history.map((record) => (
              <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-muted/30 transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {record.date ? formatTrainingDate(record.date) : "Data nieznana"}
                    </span>
                    {record.trainingType && (
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase font-bold text-muted-foreground">
                        {record.trainingType}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{record.topic || "Trening bez tematu"}</p>
                  {record.note && (
                    <p className="mt-2 max-w-2xl whitespace-pre-wrap rounded-lg border border-foreground/10 bg-muted/40 p-2.5 text-xs text-foreground">
                      <span className="font-bold uppercase tracking-wide text-muted-foreground">Notatka trenera: </span>
                      {record.note}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {record.isPresent ? (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs font-bold ${
                        record.score === "+"
                          ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                          : record.score === "-"
                          ? "border-rose-600/30 bg-rose-500/10 text-rose-800 dark:text-rose-300"
                          : "border-sky-600/30 bg-sky-500/10 text-sky-800 dark:text-sky-300"
                      }`}
                    >
                      <CheckCircle2 className="size-3.5" />
                      Obecny · {record.score ? `Ocena [ ${record.score} ]` : "Bez oceny"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1 font-mono text-xs font-bold text-destructive">
                      <XCircle className="size-3.5" />
                      Nieobecny ({translateAbsence(record.absenceReason)})
                    </span>
                  )}

                  <div className="flex items-center gap-1.5 rounded-lg border border-foreground/15 bg-background px-2.5 py-1 font-mono text-xs">
                    {record.fatigue ? (
                      <span className="font-semibold text-primary">Zmęczenie: {record.fatigue}/5</span>
                    ) : (
                      <span className="text-muted-foreground/60 italic text-[11px]">Brak ankiety</span>
                    )}
                    {record.satisfaction && (
                      <>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">Zadowolenie: {record.satisfaction}/5</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p className="font-heading text-base uppercase">Brak zapisanych jednostek</p>
              <p className="text-xs mt-1">Zawodnik nie uczestniczył jeszcze w żadnym zarejestrowanym treningu.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CoachPlayerAnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsLoadingState />}>
      <PlayerAnalyticsContent />
    </Suspense>
  );
}

function translateAbsence(reason: string | null): string {
  switch (reason) {
    case "injury":
      return "Kontuzja";
    case "illness":
      return "Choroba";
    case "excused":
      return "Usprawiedliwiona";
    case "unexcused":
      return "Nieusprawiedliwiona";
    default:
      return "Nieokreślony";
  }
}