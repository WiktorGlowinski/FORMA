"use client";

import { useState } from "react";
import { ChevronLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ABSENCE_REASONS,
  DEMO_PLAYERS,
  SCORE_OPTIONS,
  playerName,
  type AbsenceReason,
  type EvaluationScore,
} from "@/components/landing/copy";
import { INJURY_KINDS, type InjuryKind } from "@/components/coach/data";
import { InjuryIcon } from "@/components/coach/injury-icon";
import { cn } from "@/lib/utils";

type DemoMark =
  | { type: "score"; score: EvaluationScore }
  | { type: "absence"; reason: Exclude<AbsenceReason, "injury"> }
  | { type: "absence"; reason: "injury"; injury: InjuryKind };

const SCORE_TONE: Record<EvaluationScore, string> = {
  "-": "border-minus/50 text-minus hover:bg-minus/15 data-[on=true]:bg-minus data-[on=true]:text-background",
  "0": "border-zero/50 text-zero hover:bg-zero/15 data-[on=true]:bg-zero data-[on=true]:text-background",
  "+": "border-plus/50 text-plus hover:bg-plus/15 data-[on=true]:bg-plus data-[on=true]:text-background",
};

export function EvalDemo() {
  const [index, setIndex] = useState(0);
  const [marks, setMarks] = useState<Record<string, DemoMark>>({});
  const [absenceOpen, setAbsenceOpen] = useState(false);
  const [injuryOpen, setInjuryOpen] = useState(false);

  const total = DEMO_PLAYERS.length;
  const done = DEMO_PLAYERS.filter((player) => marks[player.id]).length;
  const player = DEMO_PLAYERS[index];
  const finished = index >= total;

  function commit(mark: DemoMark) {
    if (!player) return;
    setMarks((current) => ({ ...current, [player.id]: mark }));
    setAbsenceOpen(false);
    setInjuryOpen(false);
    setIndex((current) => Math.min(current + 1, total));
  }

  function goTo(next: number) {
    setAbsenceOpen(false);
    setInjuryOpen(false);
    setIndex(next);
  }

  return (
    <div className="print-card overflow-hidden rounded-md border-2 border-foreground/20 bg-card">
      <div className="mow-stripes flex items-center justify-between gap-3 px-4 py-3 text-chalk sm:px-6">
        <p className="text-sm">U14 · środa · 17:30–18:45</p>
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
        aria-label="Postęp próby oceny"
      >
        <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${(done / total) * 100}%` }} />
      </div>

      {finished || !player ? (
        <Summary
          marks={marks}
          onEdit={goTo}
          onReset={() => {
            setMarks({});
            goTo(0);
          }}
        />
      ) : (
        <PlayerStep
          player={player}
          index={index}
          total={total}
          mark={marks[player.id]}
          absenceOpen={absenceOpen}
          injuryOpen={injuryOpen}
          onToggleAbsence={() => {
            setInjuryOpen(false);
            setAbsenceOpen((open) => !open);
          }}
          onRate={(score) => commit({ type: "score", score })}
          onReason={(reason) => {
            if (reason === "injury") {
              setInjuryOpen(true);
              return;
            }
            commit({ type: "absence", reason });
          }}
          onInjury={(injury) => commit({ type: "absence", reason: "injury", injury })}
          onBack={() => goTo(Math.max(0, index - 1))}
        />
      )}
    </div>
  );
}

function PlayerStep({
  player,
  index,
  total,
  mark,
  absenceOpen,
  injuryOpen,
  onToggleAbsence,
  onRate,
  onReason,
  onInjury,
  onBack,
}: {
  player: (typeof DEMO_PLAYERS)[number];
  index: number;
  total: number;
  mark?: DemoMark;
  absenceOpen: boolean;
  injuryOpen: boolean;
  onToggleAbsence: () => void;
  onRate: (score: EvaluationScore) => void;
  onReason: (reason: AbsenceReason) => void;
  onInjury: (injury: InjuryKind) => void;
  onBack: () => void;
}) {
  const injuryMark = mark?.type === "absence" && mark.reason === "injury" ? mark.injury : undefined;

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
          <h3 className="font-heading text-4xl leading-none tracking-tight sm:text-5xl">{playerName(player)}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {player.role} · U14 · względem własnego poziomu, nie względem kolegów
          </p>
        </div>
      </div>

      {mark ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          {injuryMark ? <InjuryIcon kind={injuryMark} className="size-5 text-foreground" /> : null}
          <span>
            Zapis próby: <span className="text-foreground">{demoMarkLabel(mark)}</span>
          </span>
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

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Po wyborze aplikacja przechodzi do kolejnego nazwiska. Możesz wrócić i poprawić.
      </p>

      <div className="mt-5">
        <button
          type="button"
          aria-expanded={absenceOpen}
          onClick={onToggleAbsence}
          className={cn(
            "w-full rounded-md border-2 px-4 py-3 text-left text-sm transition duration-150 hover:-translate-y-0.5 hover:border-foreground/40 hover:bg-secondary",
            mark?.type === "absence" || absenceOpen ? "border-foreground/40 bg-secondary" : "border-foreground/15",
          )}
        >
          <span className="font-medium">Nieobecny</span>
          <span className="mt-0.5 block text-muted-foreground">Bez oceny minus, zero albo plus. Wybierz powód.</span>
        </button>
        {absenceOpen ? (
          <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label="Powód nieobecności">
            {ABSENCE_REASONS.map((reason) => {
              const selected =
                reason.id === "injury"
                  ? injuryOpen || injuryMark !== undefined
                  : mark?.type === "absence" && mark.reason === reason.id;
              return (
                <button
                  key={reason.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onReason(reason.id)}
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
        {absenceOpen && injuryOpen ? (
          <div className="mt-3" role="group" aria-label="Rodzaj kontuzji">
            <p className="text-sm text-muted-foreground">Kontuzja nie jest minusem. Wybierz, co się stało.</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {INJURY_KINDS.map((kind) => {
                const selected = injuryMark === kind.id;
                return (
                  <button
                    key={kind.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onInjury(kind.id)}
                    className={cn(
                      "flex flex-col items-center rounded-md border-2 px-2 py-3 text-center transition duration-150 hover:-translate-y-0.5",
                      selected
                        ? "border-foreground bg-primary text-primary-foreground shadow-[2px_2px_0_0_var(--foreground)]"
                        : "border-foreground/15 hover:border-foreground/40 hover:bg-accent",
                    )}
                  >
                    <InjuryIcon kind={kind.id} className="size-8" />
                    <span className="mt-2 text-sm font-medium">{kind.label}</span>
                    <span className={cn("mt-0.5 text-xs", selected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      {kind.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" size="lg" className="h-11 px-4" disabled={index === 0} onClick={onBack}>
          <ChevronLeft />
          Poprzedni
        </Button>
        <p className="text-xs text-muted-foreground">
          {injuryOpen ? "Przy kontuzji wybierz rodzaj." : "Wybór zapisuje się od razu."}
        </p>
      </div>
    </div>
  );
}

function Summary({
  marks,
  onEdit,
  onReset,
}: {
  marks: Record<string, DemoMark>;
  onEdit: (index: number) => void;
  onReset: () => void;
}) {
  return (
    <div className="step-in px-4 py-6 sm:px-8 sm:py-8">
      <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">Próba zamknięta</p>
      <h3 className="mt-2 font-heading text-4xl tracking-tight">Wszyscy mają status.</h3>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        To tylko pokaz na tej stronie. Po odświeżeniu znika. Kontuzja ma rodzaj i ikonę, tak jak w panelu trenera.
      </p>
      <ul className="mt-6 divide-y divide-border rounded-md border-2 border-foreground/15">
        {DEMO_PLAYERS.map((player, playerIndex) => {
          const mark = marks[player.id];
          const injury = mark?.type === "absence" && mark.reason === "injury" ? mark.injury : undefined;
          return (
            <li key={player.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  <span className="mr-2 text-muted-foreground tabular-nums">{player.jerseyNumber}</span>
                  {playerName(player)}
                </p>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  {injury ? <InjuryIcon kind={injury} className="size-4 shrink-0 text-foreground" /> : null}
                  <span>{mark ? demoMarkLabel(mark) : "Brak oceny. To nie jest zero."}</span>
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(playerIndex)}>
                Popraw
              </Button>
            </li>
          );
        })}
      </ul>
      <Button type="button" variant="outline" size="lg" className="mt-6 h-11 px-4" onClick={onReset}>
        <RotateCcw />
        Zacznij próbę od nowa
      </Button>
    </div>
  );
}

function demoMarkLabel(mark: DemoMark) {
  if (mark.type === "score") {
    if (mark.score === "-") return "Słabiej niż zwykle";
    if (mark.score === "0") return "Typowy poziom";
    return "Powyżej siebie";
  }
  if (mark.reason === "injury") {
    const kind = INJURY_KINDS.find((item) => item.id === mark.injury);
    return kind ? `Nieobecny · Kontuzja · ${kind.label}` : "Nieobecny · Kontuzja";
  }
  const reason = ABSENCE_REASONS.find((item) => item.id === mark.reason);
  return `Nieobecny · ${reason?.label ?? "bez powodu"}`;
}