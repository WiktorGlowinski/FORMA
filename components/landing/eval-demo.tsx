"use client";

import { useState } from "react";
import { ChevronLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ABSENCE_REASONS,
  DEMO_PLAYERS,
  SCORE_OPTIONS,
  markLabel,
  playerName,
  type AbsenceReason,
  type EvaluationScore,
  type Mark,
} from "@/components/landing/copy";
import { cn } from "@/lib/utils";

const SCORE_TONE: Record<EvaluationScore, string> = {
  "-": "border-minus/50 text-minus hover:bg-minus/15 data-[on=true]:bg-minus data-[on=true]:text-background",
  "0": "border-zero/50 text-zero hover:bg-zero/15 data-[on=true]:bg-zero data-[on=true]:text-background",
  "+": "border-plus/50 text-plus hover:bg-plus/15 data-[on=true]:bg-plus data-[on=true]:text-background",
};

export function EvalDemo() {
  const [index, setIndex] = useState(0);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [absenceOpen, setAbsenceOpen] = useState(false);

  const total = DEMO_PLAYERS.length;
  const ratedCount = DEMO_PLAYERS.filter((player) => marks[player.id]).length;
  const finished = index >= total;
  const player = DEMO_PLAYERS[index];
  const currentMark = player ? marks[player.id] : undefined;
  const allMarked = ratedCount === total;

  function commit(mark: Mark) {
    if (!player) return;
    setMarks((current) => ({ ...current, [player.id]: mark }));
    setAbsenceOpen(false);
    setIndex((current) => Math.min(current + 1, total));
  }

  function rate(score: EvaluationScore) {
    commit({ type: "score", score });
  }

  function markAbsent(reason: AbsenceReason) {
    commit({ type: "absence", reason });
  }

  function goTo(next: number) {
    setAbsenceOpen(false);
    setIndex(Math.max(0, Math.min(next, total)));
  }

  function reset() {
    setMarks({});
    setIndex(0);
    setAbsenceOpen(false);
  }

  return (
    <section id="ocena" className="scroll-mt-24" aria-labelledby="ocena-tytul">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">Podgląd na boisku</p>
          <h2 id="ocena-tytul" className="mt-2 font-heading text-4xl tracking-tight sm:text-5xl">
            Jeden zawodnik. Trzy przyciski.
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          Przykładowy skład U14. Nic nie trafia do bazy — po odświeżeniu strony próba znika.
        </p>
      </div>

      <div className="print-card overflow-hidden rounded-md border-2 border-foreground/20 bg-card">
        <div className="mow-stripes flex items-center justify-between gap-3 px-4 py-3 text-chalk sm:px-6">
          <p className="text-sm">U14 · środa · 17:30–18:45</p>
          <p className="text-sm font-medium tabular-nums">
            Oceniono {ratedCount} / {total}
          </p>
        </div>
        <div
          className="h-1 bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={ratedCount}
          aria-label="Postęp oceny składu"
        >
          <div
            className="h-full bg-primary transition-[width] duration-300"
            style={{ width: `${(ratedCount / total) * 100}%` }}
          />
        </div>

        {finished || !player ? (
          <Summary marks={marks} onEdit={goTo} onReset={reset} />
        ) : (
          <div key={player.id} className="step-in px-4 py-6 sm:px-8 sm:py-8">
            <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
              Zawodnik {index + 1} z {total}
            </p>
            <div className="mt-4 flex items-center gap-4" aria-live="polite">
              <div className="relative grid size-16 shrink-0 place-items-center rounded-full bg-muted font-heading text-2xl text-foreground">
                {player.firstName[0]}
                {player.lastName[0]}
                <span className="absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {player.jerseyNumber}
                </span>
              </div>
              <div>
                <h3 className="font-heading text-4xl leading-none tracking-tight sm:text-5xl">
                  {playerName(player)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {player.role} · U14 · względem własnego poziomu, nie względem kolegów
                </p>
              </div>
            </div>

            {currentMark ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Zapis roboczy: <span className="text-foreground">{markLabel(currentMark)}</span>
              </p>
            ) : null}

            <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3" role="group" aria-label="Ocena funkcjonowania">
              {SCORE_OPTIONS.map((option) => {
                const selected = currentMark?.type === "score" && currentMark.score === option.score;
                return (
                  <button
                    key={option.score}
                    type="button"
                    data-on={selected}
                    aria-pressed={selected}
                    onClick={() => rate(option.score)}
                    className={cn(
                      "group/score flex h-24 flex-col items-center justify-center rounded-md border-2 bg-background/50 transition duration-150 hover:-translate-y-1 hover:shadow-[3px_3px_0_0_var(--foreground)] sm:h-28",
                      SCORE_TONE[option.score],
                    )}
                  >
                    <span className="font-heading text-4xl leading-none transition-transform duration-150 group-hover/score:scale-110">
                      {option.score}
                    </span>
                    <span className="mt-1 text-xs sm:text-sm">{option.title}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Po wyborze aplikacja przechodzi do kolejnego nazwiska. Możesz wrócić i poprawić.
            </p>

            <div className="mt-5">
              <button
                type="button"
                aria-expanded={absenceOpen}
                onClick={() => setAbsenceOpen((open) => !open)}
                className={cn(
                  "w-full rounded-md border-2 px-4 py-3 text-left text-sm transition duration-150 hover:-translate-y-0.5 hover:border-foreground/40 hover:bg-secondary",
                  currentMark?.type === "absence"
                    ? "border-foreground/40 bg-secondary"
                    : "border-foreground/15",
                )}
              >
                <span className="font-medium">Nieobecny</span>
                <span className="mt-0.5 block text-muted-foreground">
                  Bez oceny minus, zero albo plus. Wybierz powód.
                </span>
              </button>
              {absenceOpen ? (
                <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label="Powód nieobecności">
                  {ABSENCE_REASONS.map((reason) => {
                    const selected =
                      currentMark?.type === "absence" && currentMark.reason === reason.id;
                    return (
                      <button
                        key={reason.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => markAbsent(reason.id)}
                        className={cn(
                          "rounded-md border-2 px-3 py-3 text-sm transition duration-150 hover:-translate-y-0.5",
                          selected
                            ? "border-foreground bg-primary text-primary-foreground shadow-[2px_2px_0_0_var(--foreground)]"
                            : "border-foreground/15 hover:border-foreground/40 hover:bg-accent",
                        )}
                      >
                        {reason.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-11 px-4"
                disabled={index === 0}
                onClick={() => goTo(index - 1)}
              >
                <ChevronLeft />
                Poprzedni
              </Button>
              {allMarked ? (
                <Button type="button" variant="secondary" size="lg" className="h-11 px-4" onClick={() => goTo(total)}>
                  Do podsumowania
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">Wybór zapisuje się od razu.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Summary({
  marks,
  onEdit,
  onReset,
}: {
  marks: Record<string, Mark>;
  onEdit: (index: number) => void;
  onReset: () => void;
}) {
  const counts = DEMO_PLAYERS.reduce(
    (acc, player) => {
      const mark = marks[player.id];
      if (!mark) acc.missing += 1;
      else if (mark.type === "absence") acc.absent += 1;
      else if (mark.score === "-") acc.minus += 1;
      else if (mark.score === "0") acc.zero += 1;
      else acc.plus += 1;
      return acc;
    },
    { minus: 0, zero: 0, plus: 0, absent: 0, missing: 0 },
  );

  return (
    <div className="step-in px-4 py-6 sm:px-8 sm:py-8">
      <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">Skład zamknięty</p>
      <h3 className="mt-2 font-heading text-4xl tracking-tight sm:text-5xl">Wszyscy mają status.</h3>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        W klubie ten zapis siada przy treningu i zostaje w historii zawodnika. Tutaj został tylko w tej karcie.
        Nieobecność nie weszła do rozkładu minus / zero / plus.
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Słabiej" value={counts.minus} tone="text-minus" />
        <Stat label="Typowo" value={counts.zero} tone="text-zero" />
        <Stat label="Powyżej" value={counts.plus} tone="text-plus" />
        <Stat label="Nieobecni" value={counts.absent} tone="text-foreground" />
      </dl>

      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border">
        {DEMO_PLAYERS.map((player, playerIndex) => {
          const mark = marks[player.id];
          return (
            <li key={player.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  <span className="mr-2 text-muted-foreground tabular-nums">{player.jerseyNumber}</span>
                  {playerName(player)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {mark ? markLabel(mark) : "Brak oceny — to nie jest zero"}
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(playerIndex)}>
                Popraw
              </Button>
            </li>
          );
        })}
      </ul>

      <div className="mt-6">
        <Button type="button" variant="outline" size="lg" className="h-11 px-4" onClick={onReset}>
          <RotateCcw />
          Zacznij skład od nowa
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl bg-muted/70 px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("font-heading text-4xl leading-none", tone)}>{value}</dd>
    </div>
  );
}