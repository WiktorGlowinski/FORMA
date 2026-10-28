"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  TRAININGS,
  formatTrainingDate,
  ratedCount,
  type TrainingSession,
  type TrainingStatus,
} from "@/components/coach/data";
import { useAllMarks } from "@/components/coach/use-coach-session";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<TrainingStatus, string> = {
  scheduled: "Zaplanowany",
  completed: "Zrealizowany",
  cancelled: "Odwołany",
};

export function TrainingBoard() {
  const { all, ready } = useAllMarks();

  return (
    <div>
      <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">Panel trenera</p>
      <h1 className="mt-2 max-w-3xl font-heading text-5xl leading-[0.95] font-semibold tracking-wide uppercase sm:text-6xl">
        Jednostki do oceny
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
        Po zrealizowanym treningu przechodzisz skład nazwisko po nazwisku. Minus, zero i plus są względem
        własnego poziomu zawodnika. Zapis zostaje w tej przeglądarce, dopóki nie podepniemy bazy.
      </p>

      {!ready ? (
        <p className="mt-8 text-sm text-muted-foreground">Odczytuję zapis z tej przeglądarki…</p>
      ) : (
        <ul className="mt-8 grid gap-4">
          {TRAININGS.map((training) => (
            <TrainingCard key={training.id} training={training} marks={all[training.id] ?? {}} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TrainingCard({
  training,
  marks,
}: {
  training: TrainingSession;
  marks: Record<string, { type: string }>;
}) {
  const done = ratedCount(training.players, marks as never);
  const total = training.players.length;
  const open = training.status === "completed";
  const finished = open && done === total;
  const started = open && done > 0 && !finished;

  return (
    <li className="print-card overflow-hidden rounded-md border-2 border-foreground/15 bg-card">
      <div className="mow-stripes flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-chalk sm:px-5">
        <p className="text-sm capitalize">{formatTrainingDate(training.date)}</p>
        <p className="text-sm font-medium">
          {training.teamName} · {training.startTime}–{training.endTime}
        </p>
      </div>
      <div className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div>
          <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">{STATUS_LABEL[training.status]}</p>
          <h2 className="mt-1 font-heading text-3xl tracking-tight">{training.place}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {training.topic ?? "Bez tematu"} · {total} zawodników
          </p>
          {open ? (
            <p className="mt-3 text-sm">
              Oceniono <span className="font-medium tabular-nums">{done} / {total}</span>
              {done === 0 ? ". Brak oceny nie jest zerem." : ""}
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              {training.status === "cancelled"
                ? "Odwołana jednostka nie prosi o ocenę."
                : "Ocenę uruchomisz po zakończeniu treningu."}
            </p>
          )}
        </div>
        {open ? (
          <Link
            href={`/trener/${training.id}`}
            className={cn(buttonVariants({ size: "lg", variant: finished ? "outline" : "default" }), "h-11 px-4")}
          >
            {finished ? "Popraw zapis" : started ? "Dokończ ocenę" : "Oceń skład"}
          </Link>
        ) : null}
      </div>
    </li>
  );
}