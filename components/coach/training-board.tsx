"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  TRAININGS,
  formatTrainingDate,
  playerName,
  ratedCount,
  type Mark,
  type SquadPlayer,
  type TrainingSession,
  type TrainingStatus,
} from "@/components/coach/data";
import { useAllMarks, useSquad } from "@/components/coach/use-coach-session";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<TrainingStatus, string> = {
  scheduled: "Zaplanowany",
  completed: "Zrealizowany",
  cancelled: "Odwołany",
};

const fieldClass =
  "mt-1 h-11 w-full rounded-md border-2 border-foreground/15 bg-background px-3 text-sm outline-none transition focus:border-foreground/50";

export function TrainingBoard() {
  const { all, ready: marksReady } = useAllMarks();
  const { players, ready: squadReady, addPlayer, removePlayer } = useSquad();
  const ready = marksReady && squadReady;

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
        <>
          <ul className="mt-8 grid gap-4">
            {TRAININGS.map((training) => (
              <TrainingCard
                key={training.id}
                training={training}
                players={players}
                marks={all[training.id] ?? {}}
              />
            ))}
          </ul>
          <SquadPanel players={players} addPlayer={addPlayer} removePlayer={removePlayer} />
        </>
      )}
    </div>
  );
}

function TrainingCard({
  training,
  players,
  marks,
}: {
  training: TrainingSession;
  players: SquadPlayer[];
  marks: Record<string, Mark>;
}) {
  const done = ratedCount(players, marks);
  const total = players.length;
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

function SquadPanel({
  players,
  addPlayer,
  removePlayer,
}: {
  players: SquadPlayer[];
  addPlayer: (player: Omit<SquadPlayer, "id">) => void;
  removePlayer: (id: string) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jersey, setJersey] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const first = firstName.trim();
    const last = lastName.trim();
    const number = Number.parseInt(jersey, 10);
    if (!first || !last) {
      setError("Wpisz imię i nazwisko.");
      return;
    }
    if (!Number.isInteger(number) || number < 1 || number > 99) {
      setError("Numer koszulki ma być od 1 do 99.");
      return;
    }
    if (players.some((player) => player.jerseyNumber === number)) {
      setError("Ten numer jest już w składzie.");
      return;
    }
    addPlayer({
      firstName: first,
      lastName: last,
      jerseyNumber: number,
      role: role.trim() || "Bez pozycji",
    });
    setFirstName("");
    setLastName("");
    setJersey("");
    setRole("");
    setError("");
  }

  return (
    <section className="print-card mt-8 overflow-hidden rounded-md border-2 border-foreground/15 bg-card">
      <div className="mow-stripes px-4 py-3 text-chalk sm:px-5">
        <p className="text-sm font-medium">Skład U14 · {players.length} osób</p>
      </div>
      <div className="px-4 py-5 sm:px-5">
        <h2 className="font-heading text-3xl tracking-tight">Dopisz zawodnika</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Nowa osoba staje na końcu kolejki przy każdej jednostce U14. Ósemka z przykładu zostaje. Dopisanych
          możesz usunąć.
        </p>
        <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block text-sm">
            <span className="text-muted-foreground">Imię</span>
            <input className={fieldClass} value={firstName} autoComplete="off" onChange={(event) => setFirstName(event.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">Nazwisko</span>
            <input className={fieldClass} value={lastName} autoComplete="off" onChange={(event) => setLastName(event.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">Numer</span>
            <input
              className={fieldClass}
              value={jersey}
              inputMode="numeric"
              autoComplete="off"
              onChange={(event) => setJersey(event.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">Pozycja</span>
            <input
              className={fieldClass}
              value={role}
              autoComplete="off"
              placeholder="Np. skrzydłowy"
              onChange={(event) => setRole(event.target.value)}
            />
          </label>
          <div className="flex items-end">
            <Button type="submit" size="lg" className="h-11 w-full">
              Dodaj do składu
            </Button>
          </div>
        </form>
        {error ? (
          <p className="mt-3 text-sm text-minus" role="alert">
            {error}
          </p>
        ) : null}
        <ul className="mt-5 divide-y divide-border rounded-md border-2 border-foreground/15">
          {players.map((player) => (
            <li key={player.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  <span className="mr-2 text-muted-foreground tabular-nums">{player.jerseyNumber}</span>
                  {playerName(player)}
                </p>
                <p className="text-sm text-muted-foreground">{player.role}</p>
              </div>
              {player.id.startsWith("extra-") ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => removePlayer(player.id)}>
                  Usuń
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}