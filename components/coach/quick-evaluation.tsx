"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, RotateCcw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  ABSENCE_REASONS,
  SCORE_OPTIONS,
  getTraining,
  markLabel,
  playerName,
  ratedCount,
  type AbsenceReason,
  type EvaluationScore,
  type Mark,
  type SquadPlayer,
} from "@/components/coach/data";
import { useTrainingMarks } from "@/components/coach/use-coach-session";
import { cn } from "@/lib/utils";

const SCORE_TONE: Record<EvaluationScore, string> = {
  "-": "border-minus/50 text-minus hover:bg-minus/15 data-[on=true]:bg-minus data-[on=true]:text-background",
  "0": "border-zero/50 text-zero hover:bg-zero/15 data-[on=true]:bg-zero data-[on=true]:text-background",
  "+": "border-plus/50 text-plus hover:bg-plus/15 data-[on=true]:bg-plus data-[on=true]:text-background",
};

export function QuickEvaluation({ trainingId }: { trainingId: string }) {
  const training = getTraining(trainingId);
  const { marks, ready, setMark, clearTraining } = useTrainingMarks(trainingId);
  const [index, setIndex] = useState(0);
  const [absenceOpen, setAbsenceOpen] = useState(false);

  if (!training) {
    return (
      <div>
        <h1 className="font-heading text-5xl uppercase">Nie ma takiej jednostki</h1>
        <p className="mt-3 text-muted-foreground">Sprawdź listę treningów trenera.</p>
        <Link href="/trener" className={cn(buttonVariants({ size: "lg" }), "mt-6 inline-flex h-11 px-4")}>
          Wróć do jednostek
        </Link>
      </div>
    );
  }

  if (training.status !== "completed") {
    return (
      <div>
        <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">{training.teamName}</p>
        <h1 className="mt-2 font-heading text-5xl uppercase">
          {training.status === "cancelled" ? "Trening odwołany" : "Trening jeszcze trwa"}
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          {training.status === "cancelled"
            ? "Odwołana jednostka nie dostaje ocen minus, zero ani plus."
            : "Szybką ocenę otworzysz, gdy jednostka będzie zrealizowana."}
        </p>
        <Link href="/trener" className={cn(buttonVariants({ size: "lg" }), "mt-6 inline-flex h-11 px-4")}>
          Wróć do jednostek
        </Link>
      </div>
    );
  }

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Odczytuję zapis tej jednostki…</p>;
  }

  const total = training.players.length;
  const done = ratedCount(training.players, marks);
  const player = training.players[index];
  const finished = index >= total;

  function commit(mark: Mark) {
    if (!player) return;
    setMark(player.id, mark);
    setAbsenceOpen(false);
    setIndex((current) => Math.min(current + 1, total));
  }

  function restart() {
    clearTraining();
    setIndex(0);
    setAbsenceOpen(false);
  }

  return (
    <div>
      <Link href="/trener" className="pitch-link text-sm text-muted-foreground">
        Wróć do jednostek
      </Link>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">
            {training.teamName} · {training.startTime}–{training.endTime}
          </p>
          <h1 className="mt-2 font-heading text-4xl tracking-tight sm:text-5xl">Jeden zawodnik. Trzy przyciski.</h1>
        </div>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          {training.place}. {training.topic}. Zapis zostaje w tej przeglądarce, nawet po odświeżeniu.
        </p>
      </div>

      <div className="print-card mt-6 overflow-hidden rounded-md border-2 border-foreground/20 bg-card">
        <div className="mow-stripes flex items-center justify-between gap-3 px-4 py-3 text-chalk sm:px-6">
          <p className="text-sm">{training.teamName}</p>
          <p className="text-sm font-medium tabular-nums">
            Oceniono {done} / {total}
          </p>
        </div>
        <div
          className="h-1 bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-label="Postęp oceny składu"
        >
          <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${(done / total) * 100}%` }} />
        </div>

        {finished || !player ? (
          <Summary
            players={training.players}
            marks={marks}
            onEdit={(next) => {
              setAbsenceOpen(false);
              setIndex(next);
            }}
            onReset={restart}
          />
        ) : (
          <PlayerStep
            player={player}
            index={index}
            total={total}
            mark={marks[player.id]}
            absenceOpen={absenceOpen}
            onToggleAbsence={() => setAbsenceOpen((open) => !open)}
            onRate={(score) => commit({ type: "score", score })}
            onAbsent={(reason) => commit({ type: "absence", reason })}
            onBack={() => {
              setAbsenceOpen(false);
              setIndex((current) => Math.max(0, current - 1));
            }}
            allMarked={done === total}
            onSummary={() => setIndex(total)}
          />
        )}
      </div>
    </div>
  );
}

function PlayerStep({
  player,
  index,
  total,
  mark,
  absenceOpen,
  onToggleAbsence,
  onRate,
  onAbsent,
  onBack,
  allMarked,
  onSummary,
}: {
  player: SquadPlayer;
  index: number;
  total: number;
  mark?: Mark;
  absenceOpen: boolean;
  onToggleAbsence: () => void;
  onRate: (score: EvaluationScore) => void;
  onAbsent: (reason: AbsenceReason) => void;
  onBack: () => void;
  allMarked: boolean;
  onSummary: () => void;
}) {
  return (
    <div key={player.id} className="step-in px-4 py-6 sm:px-8 sm:py-8">
      <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
        Zawodnik {index + 1} z {total}
      </p>
      <div className="mt-4 flex items-center gap-4" aria-live="polite">
        <div className="relative grid size-16 shrink-0 place-items-center rounded-full bg-muted font-heading text-2xl">
          {player.firstName[0]}
          {player.lastName[0]}
          <span className="absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {player.jerseyNumber}
          </span>
        </div>
        <div>
          <h2 className="font-heading text-4xl leading-none tracking-tight sm:text-5xl">{playerName(player)}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {player.role} · względem własnego poziomu, nie względem kolegów
          </p>
        </div>
      </div>

      {mark ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Zapis roboczy: <span className="text-foreground">{markLabel(mark)}</span>
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3" role="group" aria-label="Ocena funkcjonowania">
        {SCORE_OPTIONS.map((option) => {
          const selected = mark?.type === "score" && mark.score === option.score;
          return (
            <button
              key={option.score}
              type="button"
              data-on={selected}
              aria-pressed={selected}
              onClick={() => onRate(option.score)}
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

      <div className="mt-5">
        <button
          type="button"
          aria-expanded={absenceOpen}
          onClick={onToggleAbsence}
          className={cn(
            "w-full rounded-md border-2 px-4 py-3 text-left text-sm transition duration-150 hover:-translate-y-0.5 hover:border-foreground/40 hover:bg-secondary",
            mark?.type === "absence" ? "border-foreground/40 bg-secondary" : "border-foreground/15",
          )}
        >
          <span className="font-medium">Nieobecny</span>
          <span className="mt-0.5 block text-muted-foreground">Bez oceny minus, zero albo plus. Wybierz powód.</span>
        </button>
        {absenceOpen ? (
          <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label="Powód nieobecności">
            {ABSENCE_REASONS.map((reason) => {
              const selected = mark?.type === "absence" && mark.reason === reason.id;
              return (
                <button
                  key={reason.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onAbsent(reason.id)}
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
        <Button type="button" variant="outline" size="lg" className="h-11 px-4" disabled={index === 0} onClick={onBack}>
          <ChevronLeft />
          Poprzedni
        </Button>
        {allMarked ? (
          <Button type="button" variant="secondary" size="lg" className="h-11 px-4" onClick={onSummary}>
            Do podsumowania
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">Wybór zapisuje się od razu.</p>
        )}
      </div>
    </div>
  );
}

function Summary({
  players,
  marks,
  onEdit,
  onReset,
}: {
  players: SquadPlayer[];
  marks: Record<string, Mark>;
  onEdit: (index: number) => void;
  onReset: () => void;
}) {
  const counts = players.reduce(
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
      <h2 className="mt-2 font-heading text-4xl tracking-tight sm:text-5xl">Wszyscy mają status.</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        Nieobecność nie weszła do rozkładu minus / zero / plus. W klubie ten zapis siądzie przy treningu, gdy
        podepniemy bazę.
      </p>
      <dl className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Słabiej" value={counts.minus} tone="text-minus" />
        <Stat label="Typowo" value={counts.zero} tone="text-zero" />
        <Stat label="Powyżej" value={counts.plus} tone="text-plus" />
        <Stat label="Nieobecni" value={counts.absent} tone="text-foreground" />
      </dl>
      <ul className="mt-6 divide-y divide-border rounded-md border-2 border-foreground/15">
        {players.map((player, playerIndex) => {
          const mark = marks[player.id];
          return (
            <li key={player.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  <span className="mr-2 text-muted-foreground tabular-nums">{player.jerseyNumber}</span>
                  {playerName(player)}
                </p>
                <p className="text-sm text-muted-foreground">{mark ? markLabel(mark) : "Brak oceny — to nie jest zero"}</p>
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
          Wyczyść zapis tej jednostki
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-md bg-muted/70 px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("font-heading text-4xl leading-none", tone)}>{value}</dd>
    </div>
  );
}